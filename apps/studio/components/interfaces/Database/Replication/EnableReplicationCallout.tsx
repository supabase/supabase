import { useParams } from 'common'
import { useCreateTenantSourceMutation } from 'data/replication/create-tenant-source-mutation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DocsButton } from '@/components/ui/DocsButton'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { DOCS_URL } from '@/lib/constants'

const EnableReplicationModal = () => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)

  const { mutate: createTenantSource, isPending: creatingTenantSource } =
    useCreateTenantSourceMutation({
      onSuccess: () => {
        toast.success('Replication has been successfully enabled!')
        setOpen(false)
      },
      onError: (error) => {
        toast.error(`Failed to enable replication: ${error.message}`)
      },
    })

  const onEnableReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    createTenantSource({ projectRef })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="primary" className="w-min">
          Enable replication
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Replication</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2 !p-0">
          <Admonition
            type="warning"
            className="rounded-none border-0"
            title="Replication is currently in Alpha"
          >
            <p className="text-sm !leading-normal">
              This feature is in active development and may change as we gather feedback.
              Availability and behavior can evolve while in Alpha.
            </p>
            <p className="text-sm !leading-normal">
              Pricing has not been finalized yet. You can enable replication now; we'll announce
              pricing later and notify you before any charges apply.
            </p>
          </Admonition>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={creatingTenantSource} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" loading={creatingTenantSource} onClick={onEnableReplication}>
            Enable replication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const EnableReplicationCallout = ({
  type,
  className,
  hasAccess,
}: {
  type?: DestinationType | null
  className?: string
  hasAccess: boolean
}) => {
  return (
    <div className={cn('border rounded-md p-4 md:p-12 flex flex-col gap-y-4', className)}>
      <div className="flex flex-col gap-y-1">
        <h4>Replicate data to external destinations in real-time</h4>
        <p className="text-sm text-foreground-light">
          {hasAccess ? 'Enable replication' : 'Upgrade to the Pro plan'} to start replicating your
          database changes to {type ?? 'data warehouses and analytics platforms'}
        </p>
      </div>
      <div className="flex gap-x-2">
        {hasAccess ? (
          <EnableReplicationModal />
        ) : (
          <UpgradePlanButton source="replication" featureProposition="use replication" />
        )}
        <DocsButton href={`${DOCS_URL}/guides/database/replication#replication`} />
      </div>
    </div>
  )
}
