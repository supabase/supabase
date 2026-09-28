import { useParams } from 'common'
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
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { DestinationType } from './DestinationPanel/DestinationPanel.types'
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
        toast.success('Pipelines enabled')
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
          <Button variant="primary">Enable</Button>
        </DialogTrigger>
      )}
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Enable Pipelines</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-3">
          {hasAccess ? (
            <>
              <p className="text-sm text-foreground-light">
                Pipelines bills for configured pipeline hours and Postgres row data processed during
                initial sync and ongoing replication. Review{' '}
                <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/pipelines`}>
                  Pipelines pricing
                </InlineLink>{' '}
                before enabling.
              </p>
              <p className="text-sm text-foreground-light">
                Pipelines is in public alpha and may change.
              </p>
            </>
          ) : (
            <p className="text-sm text-foreground-light">Pipelines requires the Pro plan.</p>
          )}
        </DialogSection>
        <DialogFooter>
          <Button disabled={creatingTenantSource} onClick={() => setOpen(false)}>
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

export const EnablePipelinesCallout = ({ type }: { type?: DestinationType | null }) => {
  const { hasAccess } = useCheckEntitlements('replication.etl')

  return (
    <Admonition
      type="note"
      layout="responsive"
      title={hasAccess ? 'Enable Pipelines' : 'Upgrade to Pro for Pipelines'}
      description={
        hasAccess
          ? `Pipelines must be enabled before this project can replicate database changes to ${type ?? 'external destinations'}.`
          : `The Pro plan is required to replicate database changes to ${type ?? 'external destinations'} with Pipelines.`
      }
      actions={
        hasAccess ? (
          <EnablePipelinesModal />
        ) : (
          <UpgradePlanButton source="replication" featureProposition="use replication" />
        )
      }
    />
  )
}
