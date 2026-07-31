import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

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
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Enable Pipelines</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2 p-0!">
          <Admonition
            type="warning"
            className="rounded-none border-0"
            title="Pipelines is currently in public alpha"
          >
            {hasAccess ? (
              <>
                <p className="text-sm leading-normal!">
                  Public alpha features may change as we refine the product and incorporate customer
                  feedback.
                </p>
                <p className="text-sm leading-normal!">
                  Pipelines is billed for configured pipeline hours and Postgres row data processed
                  during initial sync and ongoing replication. Review the{' '}
                  <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/pipelines`}>
                    Pipelines pricing
                  </InlineLink>{' '}
                  before enabling it.
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground-light">
                Supabase Pipelines replicates database changes to supported destination systems.{' '}
                {hasAccess ? 'Enable Pipelines for your project' : 'Upgrade to the Pro plan'} to
                replicate database changes to data warehouses and analytics platforms.
              </p>
            )}
          </Admonition>
        </DialogSection>
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
