import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { usePgPartmanStatus } from '../usePgPartmanStatus'
import { EnableExtensionModal } from '@/components/interfaces/Database/Extensions/EnableExtensionModal'

export function PgPartmanCallout() {
  const { pgPartmanExtension, isAvailable, isInstalled } = usePgPartmanStatus()
  const [showEnableModal, setShowEnableModal] = useState(false)

  if (!isAvailable || isInstalled) return null

  return (
    <div className="mx-5 my-2">
      <Admonition
        type="tip"
        title="pg_partman is now available"
        description="Unlock partitioned queues for automatic data retention, lower storage costs, and faster performance at scale."
      >
        <Button
          type="default"
          size="tiny"
          className="mt-2"
          onClick={() => setShowEnableModal(true)}
        >
          Enable pg_partman
        </Button>
      </Admonition>
      {pgPartmanExtension && (
        <EnableExtensionModal
          visible={showEnableModal}
          extension={pgPartmanExtension}
          onCancel={() => setShowEnableModal(false)}
        />
      )}
    </div>
  )
}
