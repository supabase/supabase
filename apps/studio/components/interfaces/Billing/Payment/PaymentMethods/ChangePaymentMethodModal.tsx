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

import { useOrganizationPaymentMethodMarkAsDefaultMutation } from '@/data/organizations/organization-payment-method-default-mutation'
import type { OrganizationPaymentMethod } from '@/data/organizations/organization-payment-methods-query'

export interface ChangePaymentMethodModalProps {
  selectedPaymentMethod?: OrganizationPaymentMethod
  onClose: () => void
}

const ChangePaymentMethodModal = ({
  selectedPaymentMethod,
  onClose,
}: ChangePaymentMethodModalProps) => {
  const { slug } = useParams()
  const { mutateAsync: markAsDefault } = useOrganizationPaymentMethodMarkAsDefaultMutation({
    onSuccess: () => {
      toast.success(
        `Successfully changed payment method to the card ending with ${
          selectedPaymentMethod!.card!.last4
        }`
      )
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to change payment method: ${error.message}`)
    },
  })

  const onConfirmUpdate = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedPaymentMethod) return console.error('Card ID is required')

    await markAsDefault({
      slug,
      paymentMethodId: selectedPaymentMethod.id,
    })
  }

  return (
    <AlertDialog open={selectedPaymentMethod !== undefined} onOpenChange={() => onClose()}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>{`Confirm to use payment method ending with ${selectedPaymentMethod?.card?.last4}`}</AlertDialogTitle>
          <AlertDialogDescription>
            Upon clicking confirm, all future charges will be deducted from the card ending with{' '}
            {selectedPaymentMethod?.card?.last4}. There are no immediate charges.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmUpdate}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ChangePaymentMethodModal
