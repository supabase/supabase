import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useCreateTenantSourceMutation } from 'data/replication/create-tenant-source-mutation'
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
import { Admonition } from 'ui-patterns'

export const EnableReplicationModal = () => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)

  const { mutateAsync: createTenantSource, isLoading: creatingTenantSource } =
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
    await createTenantSource({ projectRef })
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
          <DialogTitle>Confirm to enable Replication</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2 !p-0">
          <Admonition
            type="warning"
            className="rounded-none border-0 mb-0"
            title="Replication is currently in Alpha"
          >
            <p className="text-sm !leading-normal">
              This feature is in active development and may change as we gather feedback.
              Availability and behavior can evolve while in Alpha.
            </p>
            <p className="text-sm !leading-normal">
              Pricing has not been finalized yet. You can enable replication now; we’ll announce
              pricing later and notify you before any charges apply.
            </p>
          </Admonition>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={creatingTenantSource}>
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
