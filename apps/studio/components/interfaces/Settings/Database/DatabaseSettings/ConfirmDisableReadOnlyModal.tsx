import { useParams } from 'common'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { useDisableReadOnlyModeMutation } from '@/data/config/project-temp-disable-read-only-mutation'

interface ConfirmDisableReadOnlyModeModalProps {
  visible: boolean
  onClose: () => void
}

const ConfirmDisableReadOnlyModeModal = ({
  visible,
  onClose,
}: ConfirmDisableReadOnlyModeModalProps) => {
  const { ref } = useParams()
  const { mutateAsync: disableReadOnlyMode, isPending } = useDisableReadOnlyModeMutation({
    onSuccess: () => {
      toast.success('Successfully disabled read-only mode for 15 minutes')
      onClose()
    },
  })

  return (
    <AlertDialog open={visible} onOpenChange={onClose}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm to temporarily disable read-only mode</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col space-y-2">
              <p className="text-sm">
                This will temporarily allow writes to your database for the{' '}
                <span className="text-amber-900">next 15 minutes</span>, during which you can reduce
                your database size. After deleting data, you should run a vacuum to reclaim as much
                space as possible.
              </p>
              <p className="text-sm">
                If your database size has not been sufficiently reduced after 15 minutes, read-only
                mode will be toggled back on. Otherwise, it will stay disabled.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (!ref) return console.error('Project ref is required')
              await disableReadOnlyMode({ projectRef: ref })
            }}
            disabled={isPending}
            loading={isPending}
          >
            Disable read-only mode
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDisableReadOnlyModeModal
