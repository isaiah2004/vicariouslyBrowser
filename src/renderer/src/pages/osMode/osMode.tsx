import { useState, useRef } from 'react'
import Versions from '../../components/Versions'
import electronLogo from '../../assets/electron.svg'
import { VideoIcon, StopCircleIcon } from 'lucide-react'

export default function OsMode(): JSX.Element {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

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

      const primaryScreen = sources[0]
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: primaryScreen.id,
            minWidth: 1280,
            maxWidth: 4000,
            minHeight: 720,
            maxHeight: 4000
          }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(
        constraints as MediaStreamConstraints
      )

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

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">OS Mode</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-indicator-dot" />
          Recording in progress...
        </div>
      )}

      <div className="recording-controls">
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
      </div>

      {error && <div className="recording-error">{error}</div>}

      <Versions />
    </>
  )
}
