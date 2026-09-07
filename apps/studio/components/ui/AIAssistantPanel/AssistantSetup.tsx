import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'

import { AssistantConnectOrganization } from './AssistantConnectOrganization'
import { AssistantProjectPermissions } from './AssistantProjectPermissions'
import { AlertError } from '@/components/ui/AlertError'
import { useAiAssistantState, useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'

/** Onboarding runs before project conversation hydration on every Studio surface. */
export function AssistantSetup({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const state = useAiAssistantState()
  const snap = useAiAssistantStateSnapshot()
  const [isPermissionsVisible, setIsPermissionsVisible] = useState(false)

  let content
  if (snap.oauthRequiredOrgSlug) {
    content = (
      <AssistantConnectOrganization
        orgSlug={snap.oauthRequiredOrgSlug}
        onConnected={state.reload}
      />
    )
  } else if (snap.isProjectConsentRequired) {
    content = (
      <AssistantProjectPermissions
        visible={isPermissionsVisible}
        onVisibleChange={setIsPermissionsVisible}
        onPermissionsSaved={state.reload}
      />
    )
  } else if (snap.initializationError) {
    content = (
      <AlertError
        subject="Failed to load Assistant"
        error={{ message: snap.initializationError }}
        additionalActions={
          <Button variant="default" onClick={state.reload}>
            Try again
          </Button>
        }
      />
    )
  } else {
    content = (
      <div role="status" className="flex items-center justify-center gap-2 text-foreground-light">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading Assistant...</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full w-full', className)}>
      {onClose && (
        <div className="flex justify-end px-4 py-2">
          <Button
            variant="text"
            icon={<X size={16} />}
            aria-label="Close Assistant"
            onClick={onClose}
          />
        </div>
      )}
      <div className="p-7 my-auto w-full">{content}</div>
    </div>
  )
}
