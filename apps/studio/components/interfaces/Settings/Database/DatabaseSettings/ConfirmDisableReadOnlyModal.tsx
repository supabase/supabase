import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common/hooks'
import { useDisableReadOnlyModeMutation } from 'data/config/project-temp-disable-read-only-mutation'
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

interface ConfirmDisableReadOnlyModeModalProps {
  onClose?: () => void
}

export const ConfirmDisableReadOnlyModeModal = ({
  onClose,
}: ConfirmDisableReadOnlyModeModalProps) => {
  const [visible, setVisible] = useState(false)
  const { ref } = useParams()
  const { mutate: disableReadOnlyMode, isLoading } = useDisableReadOnlyModeMutation({
    onSuccess: () => {
      toast.success('Successfully disabled read-only mode for 15 minutes')
      onClose?.()
    },
  })

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          setVisible(false)
          onClose?.()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="default" onClick={() => setVisible(true)}>
          Disable read-only mode
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm to temporarily disable read-only mode</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-sm">
            This will temporarily allow writes to your database for the{' '}
            <span className="text-amber-900">next 15 minutes</span>, during which you can reduce
            your database size. After deleting data, you should run a vacuum to reclaim as much
            space as possible.
          </p>
          <p className="text-sm">
            If your database size has not been sufficiently reduced after 15 minutes, read-only mode
            will be toggled back on. Otherwise, it will stay disabled.
          </p>
        </DialogSection>
        <DialogFooter>
          <Button
            type="default"
            disabled={isLoading}
            onClick={() => {
              setVisible(false)
              onClose?.()
            }}
          >
            Cancel
          </Button>
          <Button
            loading={isLoading}
            onClick={() => {
              if (!ref) return console.error('Project ref is required')
              disableReadOnlyMode({ projectRef: ref })
              setVisible(false)
              onClose?.()
            }}
          >
            Disable read-only mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
