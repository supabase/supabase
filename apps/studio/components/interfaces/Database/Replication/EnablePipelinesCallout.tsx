import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { DOCS_URL } from '@/lib/constants'

type EnablePipelinesModalProps =
  | { open: boolean; onOpenChange: (open: boolean) => void }
  | { open?: never; onOpenChange?: never }

export const EnablePipelinesModal = ({
  open: extOpen,
  onOpenChange,
}: EnablePipelinesModalProps) => {
  const { ref: projectRef } = useParams()
  const [_open, _setOpen] = useState(false)

  const open = extOpen ?? _open
  const setOpen = onOpenChange ?? _setOpen
  const hideTrigger = extOpen !== undefined && onOpenChange !== undefined

  const { hasAccess } = useCheckEntitlements('replication.etl')

  const { mutate: createTenantSource, isPending: creatingTenantSource } =
    useCreateTenantSourceMutation({
      onSuccess: () => {
        toast.success('Pipelines has been successfully enabled!')
        setOpen(false)
      },
      onError: (error) => {
        toast.error(`Failed to enable Pipelines: ${error.message}`)
      },
    })

  const onEnablePipelines = async () => {
    if (!projectRef) return console.error('Project ref is required')
    createTenantSource({ projectRef })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="primary" className="w-min">
            Enable Pipelines
          </Button>
        </DialogTrigger>
      )}
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Enable Pipelines</DialogTitle>
          <DialogDescription>
            {hasAccess
              ? 'Enabling creates Pipelines resources for this project.'
              : 'Upgrade to the Pro plan to replicate database changes to data warehouses and analytics platforms.'}
          </DialogDescription>
        </DialogHeader>
        {hasAccess && (
          <>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-y-3">
              <p className="text-sm text-foreground-light">
                Pipelines is in public alpha and may change as we refine it.
              </p>
              <p className="text-sm text-foreground-light">
                You’ll be billed for configured pipeline hours and for Postgres row data processed
                during initial sync and ongoing replication. Review{' '}
                <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/pipelines`}>
                  Pipelines pricing
                </InlineLink>{' '}
                before enabling.
              </p>
            </DialogSection>
          </>
        )}
        <DialogFooter>
          <Button variant="default" disabled={creatingTenantSource} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {hasAccess ? (
            <Button variant="primary" loading={creatingTenantSource} onClick={onEnablePipelines}>
              Enable Pipelines
            </Button>
          ) : (
            <UpgradePlanButton source="replication" featureProposition="use replication" />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const EnablePipelinesCallout = ({
  type,
  className,
}: {
  type?: DestinationType | null
  className?: string
}) => {
  const { hasAccess } = useCheckEntitlements('replication.etl')

  return (
    <div className={cn('border rounded-md p-4 md:p-12 flex flex-col gap-y-4', className)}>
      <div className="flex flex-col gap-y-1">
        <h4>Enable Pipelines</h4>
        <p className="text-sm text-foreground-light">
          Supabase Pipelines replicates database changes to supported destination systems.{' '}
          {hasAccess ? 'Enable Pipelines for your project' : 'Upgrade to the Pro plan'} to replicate
          database changes to {type ?? 'data warehouses and analytics platforms'}.
        </p>
      </div>
      <div className="flex gap-x-2">
        {hasAccess ? (
          <EnablePipelinesModal />
        ) : (
          <UpgradePlanButton source="replication" featureProposition="use replication" />
        )}
        <DocsButton href={`${DOCS_URL}/guides/database/replication#pipelines`} />
      </div>
    </div>
  )
}
