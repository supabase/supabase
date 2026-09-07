import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { connectAssistantOrganization } from '@/lib/assistant/connect'

export function AssistantConnectOrganization({
  orgSlug,
  onConnected,
}: {
  orgSlug: string
  onConnected: () => void
}) {
  const [isConnecting, setIsConnecting] = useState(false)
  const connectionAbort = useRef<AbortController | null>(null)
  useEffect(
    () => () => {
      connectionAbort.current?.abort()
    },
    [orgSlug]
  )

  const handleConnect = async () => {
    connectionAbort.current?.abort()
    const controller = new AbortController()
    connectionAbort.current = controller
    setIsConnecting(true)
    try {
      await connectAssistantOrganization(orgSlug, window.location.href, controller.signal)
      if (!controller.signal.aborted) onConnected()
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(error instanceof Error ? error.message : 'Failed to connect Assistant')
      }
    } finally {
      if (connectionAbort.current === controller) setIsConnecting(false)
    }
  }

  return (
    <Admonition
      type="default"
      title="Connect Assistant"
      description="Authorize Assistant to access this organization, then choose what it can share with AI providers for this project."
    >
      <Button onClick={handleConnect} loading={isConnecting} disabled={isConnecting}>
        Connect Assistant
      </Button>
    </Admonition>
  )
}
