import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { useCreateInviteCodeMutation } from 'data/invite-codes/create-invite-code-mutation'

interface CreateInviteCodeDialogProps {
  projectRef: string | undefined
  projectId: string
}

export function CreateInviteCodeDialog({ projectRef, projectId }: CreateInviteCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [maxSlots, setMaxSlots] = useState(10)
  const [error, setError] = useState<string | null>(null)

  const { mutate: createCode, isPending } = useCreateInviteCodeMutation({
    projectRef,
    onSuccess: () => {
      setOpen(false)
      setMaxSlots(10)
      setError(null)
    },
    onError: (err) => {
      setError(err.message ?? 'Failed to create invite code')
    },
  })

  const handleSubmit = () => {
    if (!projectId) return
    setError(null)
    createCode({ projectId, maxSlots })
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setMaxSlots(10)
      setError(null)
    }
    setOpen(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button icon={<Plus />}>Create Invite Code</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader padding="small">
          <DialogTitle>Create Invite Code</DialogTitle>
          <DialogDescription>
            Generate an invite code that allows users to register for this project.
          </DialogDescription>
        </DialogHeader>

        <DialogSection padding="small" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label_Shadcn_ htmlFor="max-slots">Max Users</Label_Shadcn_>
            <Input_Shadcn_
              id="max-slots"
              type="number"
              min={1}
              max={1000}
              value={maxSlots}
              onChange={(e) => setMaxSlots(Number(e.target.value))}
              disabled={isPending}
            />
            <p className="text-xs text-foreground-light">
              Maximum number of users that can register with this code (1–1000).
            </p>
          </div>

          {error !== null && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </DialogSection>

        <DialogFooter padding="small">
          <Button type="default" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isPending}
            disabled={isPending || maxSlots < 1 || maxSlots > 1000}
          >
            Create Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
