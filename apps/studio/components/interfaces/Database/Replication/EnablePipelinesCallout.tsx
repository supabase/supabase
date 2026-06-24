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
import { Admonition } from 'ui-patterns'

import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DocsButton } from '@/components/ui/DocsButton'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { DOCS_URL } from '@/lib/constants'

const EnablePipelinesModal = () => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)

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
      <DialogTrigger asChild>
        <Button variant="primary" className="w-min">
          Enable Pipelines
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Pipelines</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2 p-0!">
          <Admonition
            type="warning"
            className="rounded-none border-0"
            title="Pipelines is currently in alpha"
          >
            <p className="text-sm leading-normal!">
              Alpha features can be unstable and may introduce breaking changes while we evaluate
              the product direction, refine the feature set, and incorporate customer feedback.
            </p>
            <p className="text-sm leading-normal!">
              Pricing is not finalized. You can enable Pipelines now; we'll announce pricing later
              and notify you before any charges apply.
            </p>
          </Admonition>
        </DialogSection>
        <DialogFooter>
          <Button variant="default" disabled={creatingTenantSource} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" loading={creatingTenantSource} onClick={onEnablePipelines}>
            Enable Pipelines
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const EnablePipelinesCallout = ({
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
        <h4>Enable Pipelines</h4>
        <p className="text-sm text-foreground-light">
          Pipelines creates managed replication pipelines that stream database changes to
          destination systems.{' '}
          {hasAccess ? 'Enable Pipelines for your project' : 'Upgrade to the Pro plan'} to stream
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
