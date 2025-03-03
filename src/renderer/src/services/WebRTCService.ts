class WebRTCService {
  private static instance: WebRTCService
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private audioStream: MediaStream | null = null
  private isActive = false

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService()
    }
    return WebRTCService.instance
  }

  async cleanup(): Promise<void> {
    if (this.dataChannel) {
      try {
        const closeMessage = {
          type: 'session.close',
          reason: 'user_navigation'
        }
        if (this.dataChannel.readyState === 'open') {
          await new Promise<void>((resolve) => {
            this.dataChannel?.send(JSON.stringify(closeMessage))
            setTimeout(resolve, 100) // Give time for message to be sent
          })
        }
      } catch (e) {
        console.log('Could not send close message:', e)
      }
      this.dataChannel.close()
      this.dataChannel = null
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.audioStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.isActive = false
  }

  getState(): boolean {
    return this.isActive
  }

  // Add other methods as needed
}

export default WebRTCService
