/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react'
import { VideoIcon, StopCircleIcon, MicIcon, PhoneOff } from 'lucide-react'
import AbstractBall from '@renderer/components/abstract-ball'
import useWebRTCAudioSession from '@renderer/hooks/use-webrtc'
import { useToolsFunctions } from '@renderer/hooks/use-tools'
import { tools } from '@renderer/lib/tools'
import { motion } from 'framer-motion'
import './osMode.css'

// Constants
const INITIAL_CONFIG = {
  perlinTime: 50.0,
  perlinDNoise: 2.5,
  chromaRGBr: 7.5,
  chromaRGBg: 5,
  chromaRGBb: 7,
  chromaRGBn: 0,
  chromaRGBm: 1.0,
  sphereWireframe: false,
  spherePoints: false,
  spherePsize: 1.0,
  cameraSpeedY: 0.0,
  cameraSpeedX: 0.0,
  cameraZoom: 175,
  cameraGuide: false,
  perlinMorph: 5.5
}

const FUNCTION_NAME_MAP: Record<string, string> = {
  timeFunction: 'getCurrentTime',
  backgroundFunction: 'changeBackgroundColor',
  partyFunction: 'partyMode',
  launchWebsite: 'launchWebsite',
  copyToClipboard: 'copyToClipboard',
  scrapeWebsite: 'scrapeWebsite',
  toogleGridOverlay: 'toogleGridOverlay',
  ScreenDescriber: 'ScreenDescriber'
}

export default function OsMode(): JSX.Element {
  // State
  const [voice] = useState('alloy') // Add voice state
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState(INITIAL_CONFIG)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Hooks - now passing tools
  const {
    currentVolume,
    isSessionActive,
    handleStartStopClick,
    registerFunction,
    status,
    conversation,
    sendTextMessage
  } = useWebRTCAudioSession(voice, tools)

  const toolsFunctions = useToolsFunctions()
  // console.log(toolsFunctions)

  // Screen Recording Functions
  const startRecording = async (): Promise<void> => {
    setError(null)
    try {
      const sources = await window.electron.desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 0, height: 0 }
      })

      if (!sources.length) {
        throw new Error('No screen sources found')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[0].id,
            minWidth: 1280,
            maxWidth: 4000,
            minHeight: 720,
            maxHeight: 4000
          }
        } as MediaTrackConstraints
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e): void => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = (): void => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `screen-recording-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing screen:', err)
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      setIsRecording(false)
    }
  }

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  // Effects
  useEffect(() => {
    Object.entries(toolsFunctions).forEach(([name, func]) => {
      registerFunction(FUNCTION_NAME_MAP[name], func)
    })
  }, [registerFunction, toolsFunctions])

  useEffect(() => {
    if (!isSessionActive) {
      setConfig(INITIAL_CONFIG)
      return
    }

    setConfig({
      ...INITIAL_CONFIG,
      ...(isSessionActive && currentVolume > 0.01 ? { perlinTime: 20.0, perlinMorph: 25.0 } : {})
    })
  }, [isSessionActive, currentVolume])

  const handleToggleOverlay = (): void => {
    window.electron.ipcRenderer.invoke('toggle-grid-overlay')
  }

  return (
    <motion.div
      className="container flex flex-col items-center justify-center h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="live-chat">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <AbstractBall {...config} />
        </motion.div>

        <motion.div
          className="mt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button onClick={handleStartStopClick} className="toggle-button">
            {isSessionActive ? <PhoneOff size={18} /> : <MicIcon size={18} />}
          </button>
        </motion.div>
        {status && (
          <motion.div
            className="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="ts">{status}</span>
          </motion.div>
        )}
      </div>

      {isRecording && (
        <motion.div
          className="recording-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="recording-indicator-dot" />
          Recording in progress...
        </motion.div>
      )}

      <motion.div
        className="recording-controls"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button onClick={handleToggleOverlay} className="toggle-button">
          Toggle overlay-grid
        </button>
        {!isRecording ? (
          <button onClick={startRecording} className="toggle-button">
            <VideoIcon size={16} />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="toggle-button"
            style={{ background: '#e81123' }}
          >
            <StopCircleIcon size={16} />
            Stop Recording
          </button>
        )}
      </motion.div>

      {error && (
        <motion.div className="recording-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.div>
      )}
    </motion.div>
  )
}
