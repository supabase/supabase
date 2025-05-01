import { useEffect } from 'react'

interface LivePreviewProps {
  onUpdate: (data: any) => void
}

export function LivePreview({ onUpdate }: LivePreviewProps) {
  useEffect(() => {
    console.log('[LivePreview] Setting up message listener for LivePreview updates')

    // Listen for updates from the CMS admin panel via postMessage
    const handleMessage = (event: MessageEvent) => {
      // Log all received messages to help with debugging
      console.log('[LivePreview] Received message:', event)

      try {
        const data = event.data
        // Make sure we're only processing valid LivePreview messages
        if (data && typeof data === 'object' && 'type' in data) {
          if (data.type === 'payload-live-preview') {
            console.log('[LivePreview] Received live preview data:', data.payload)
            onUpdate(data.payload)
          }
        }
      } catch (error) {
        console.error('[LivePreview] Error processing message:', error)
      }
    }

    // Add the event listener
    window.addEventListener('message', handleMessage)

    // Send a ready message to the parent window
    if (window.parent !== window) {
      console.log('[LivePreview] Sending ready message to parent')
      window.parent.postMessage({ type: 'preview-frame-loaded' }, '*')
    }

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onUpdate])

  // This component doesn't render anything
  return null
}
