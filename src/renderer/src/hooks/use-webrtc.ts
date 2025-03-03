/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Tool } from '@renderer/lib/tools'
import WebRTCService from '../services/WebRTCService'

interface Conversation {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  isFinal: boolean
  status?: 'speaking' | 'processing' | 'final'
}

interface UseWebRTCAudioSessionReturn {
  status: string
  isSessionActive: boolean
  audioIndicatorRef: React.RefObject<HTMLDivElement | null>
  startSession: () => Promise<void>
  stopSession: () => void
  handleStartStopClick: () => void
  registerFunction: (name: string, fn: Function) => void
  msgs: any[]
  currentVolume: number
  conversation: Conversation[]
  sendTextMessage: (text: string) => void
}

const useWebRTCAudioSession = (voice: string, tools?: Tool[]): UseWebRTCAudioSessionReturn => {
  const webRTCService = WebRTCService.getInstance()
  const isMounted = useRef(true)

  const [status, setStatus] = useState('')
  const [isSessionActive, setIsSessionActive] = useState(false)
  const audioIndicatorRef = useRef<HTMLDivElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const functionRegistry = useRef<Record<string, Function>>({})
  const [currentVolume, setCurrentVolume] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const volumeIntervalRef = useRef<number | null>(null)
  const [conversation, setConversation] = useState<Conversation[]>([])
  const ephemeralUserMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    isMounted.current = true

    const handleBeforeUnload = async () => {
      await webRTCService.cleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      isMounted.current = false
      window.removeEventListener('beforeunload', handleBeforeUnload)
      webRTCService.cleanup().catch(console.error)
    }
  }, [])

  // Add method to register tool functions
  const registerFunction = (name: string, fn: Function) => {
    // console.log('registering function name: ' + name)
    functionRegistry.current[name] = fn
  }

  // Add data channel configuration
  const configureDataChannel = (dataChannel: RTCDataChannel) => {
    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        tools: tools || []
      }
    }

    dataChannel.send(JSON.stringify(sessionUpdate))
  }

  // Add data channel message handler
  const handleDataChannelMessage = async (event: MessageEvent) => {
    if (!isMounted.current) return

    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'response.function_call_arguments.done') {
        const fn = functionRegistry.current[msg.name]
        if (fn) {
          const args = JSON.parse(msg.arguments)
          const result = await fn(args)

          const response = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: msg.call_id,
              output: JSON.stringify(result)
            }
          }

          dataChannelRef.current?.send(JSON.stringify(response))
        }
      }

      // Handle conversation updates
      switch (msg.type) {
        case 'input_audio_buffer.speech_started': {
          const ephemeralId = uuidv4()
          ephemeralUserMessageIdRef.current = ephemeralId
          setConversation((prev) => [
            ...prev,
            {
              id: ephemeralId,
              role: 'user',
              text: '',
              timestamp: new Date().toISOString(),
              isFinal: false,
              status: 'speaking'
            }
          ])
          break
        }
        // ... [Add other conversation handling cases]
      }

      setMsgs((prevMsgs) => [...prevMsgs, msg])
      return msg
    } catch (error) {
      console.error('Error handling data channel message:', error)
    }
  }

  // cuse electron main process for backend
  const getEphemeralToken = async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke('get-ephemeral-token')
      return data.client_secret.value
    } catch (error) {
      console.error('Failed to get ephemeral token:', error)
      throw new Error('Failed to get ephemeral token')
    }
  }

  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyzer = audioContext.createAnalyser()
    analyzer.fftSize = 256

    source.connect(analyzer)

    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const updateIndicator = () => {
      if (!audioContext) return

      analyzer.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength

      if (audioIndicatorRef.current) {
        audioIndicatorRef.current.classList.toggle('active', average > 30)
      }

      requestAnimationFrame(updateIndicator)
    }

    updateIndicator()
    audioContextRef.current = audioContext
  }

  const getVolume = (): number => {
    if (!analyserRef.current) return 0

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteTimeDomainData(dataArray)

    // Calculate RMS (Root Mean Square)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const float = (dataArray[i] - 128) / 128
      sum += float * float
    }

    return Math.sqrt(sum / dataArray.length)
  }

  const startSession = async () => {
    try {
      if (!isMounted.current) return

      if (peerConnectionRef.current) {
        await stopSession()
      }

      setStatus('Requesting microphone access...')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      setupAudioVisualization(stream)

      setStatus('Fetching ephemeral token...')
      const ephemeralToken = await getEphemeralToken()

      setStatus('Establishing connection...')

      const pc = new RTCPeerConnection()
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]

        // Set up audio analysis
        const audioContext = new (window.AudioContext || window.AudioContext)()
        const source = audioContext.createMediaStreamSource(e.streams[0])
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        source.connect(analyser)
        analyserRef.current = analyser

        // Start volume monitoring
        volumeIntervalRef.current = window.setInterval(() => {
          const volume = getVolume()
          setCurrentVolume(volume)

          // Optional: Log when speech is detected
          if (volume > 0.1) {
            console.log('Speech detected with volume:', volume)
          }
        }, 100)
      }

      // Add data channel
      const dataChannel = pc.createDataChannel('response', {
        ordered: true
      })

      dataChannel.onopen = () => {
        if (isMounted.current) {
          configureDataChannel(dataChannel)
        }
      }

      dataChannel.onclose = () => {
        if (isMounted.current) {
          console.log('Data channel closed normally')
        }
      }

      dataChannel.onmessage = handleDataChannelMessage

      pc.addTrack(stream.getTracks()[0])

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('generated sucessfully' + ephemeralToken)
      const baseUrl = 'https://api.openai.com/v1/realtime'
      // const model = 'gpt-4o-realtime-preview-2024-12-17'
      const model = 'gpt-4o-mini-realtime-preview-2024-12-17'

      const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp'
        }
      })

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: await response.text()
      })

      peerConnectionRef.current = pc
      setIsSessionActive(true)
      setStatus('Session established successfully!')
    } catch (err) {
      if (isMounted.current) {
        console.error(err)
        setStatus(`Error: ${err}`)
        await webRTCService.cleanup()
      }
    }
  }

  const stopSession = async () => {
    if (!isMounted.current) return
    await webRTCService.cleanup()

    if (isMounted.current) {
      setIsSessionActive(false)
      setStatus('')
      setMsgs([])
      setCurrentVolume(0)
    }
  }

  const handleStartStopClick = () => {
    if (isSessionActive) {
      stopSession()
    } else {
      startSession()
    }
  }

  const sendTextMessage = (text: string) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.error('Data channel not ready')
      return
    }

    const messageId = uuidv4()

    setConversation((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'user',
        text,
        timestamp: new Date().toISOString(),
        isFinal: true,
        status: 'final'
      }
    ])

    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }

    dataChannelRef.current.send(JSON.stringify(message))
    dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }))
  }

  return {
    status,
    isSessionActive,
    audioIndicatorRef,
    startSession,
    stopSession,
    handleStartStopClick,
    registerFunction,
    msgs,
    currentVolume,
    conversation,
    sendTextMessage
  }
}

export default useWebRTCAudioSession
