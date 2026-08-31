import { useParams } from 'common/hooks'
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

import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

interface AllowAllModalProps {
  visible: boolean
  onClose: () => void
}

const AllowAllModal = ({ visible, onClose }: AllowAllModalProps) => {
  const { ref } = useParams()
  const { mutateAsync: applyNetworkRestrictions, isPending: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => onClose(),
    })

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    await applyNetworkRestrictions({
      projectRef: ref,
      dbAllowedCidrs: ['0.0.0.0/0'],
      dbAllowedCidrsV6: ['::/0'],
    })
  }

  return (
    <AlertDialog open={visible} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Allow access from all IP addresses</AlertDialogTitle>
          <AlertDialogDescription>
            This will allow any IP address to access your project's database. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isApplying}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit} disabled={isApplying} loading={isApplying}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AllowAllModal
