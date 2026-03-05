import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from '@ui/components/shadcn/ui/dialog'
import { useAwsManagedOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from 'ui'

import NewAwsMarketplaceOrgForm, {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
  NewMarketplaceOrgForm,
} from './NewAwsMarketplaceOrgForm'

interface Props {
  buyerId: string
  visible: boolean
  onSuccess: (newlyCreatedOrgSlug: string) => void
  onClose: () => void
}

const NewAwsMarketplaceOrgModal = ({ buyerId, visible, onSuccess, onClose }: Props) => {
  const { mutate: createOrganization, isPending: isCreatingOrganization } =
    useAwsManagedOrganizationCreateMutation({
      onSuccess: (org) => {
        //TODO(thomas): send tracking event?
        onSuccess(org.slug)
      },
      onError: (res) => {
        toast.error(res.message, {
          duration: 7_000,
        })
      },
    })

  const onSubmit: SubmitHandler<NewMarketplaceOrgForm> = async (values) => {
    createOrganization({ ...values, buyerId })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        size="xlarge"
        onEscapeKeyDown={(e) => (isCreatingOrganization ? e.preventDefault() : onClose())}
        onPointerDownOutside={(e) => (isCreatingOrganization ? e.preventDefault() : onClose())}
        className="p-2"
      >
        <DialogHeader>
          <DialogTitle>Create a new organization</DialogTitle>
          <DialogDescription>
            A new organization will be created and linked to your AWS Marketplace subscription
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <NewAwsMarketplaceOrgForm onSubmit={onSubmit}></NewAwsMarketplaceOrgForm>
        </DialogSection>
        <DialogFooter>
          <Button
            form={CREATE_AWS_MANAGED_ORG_FORM_ID}
            htmlType="submit"
            loading={isCreatingOrganization}
            size="medium"
          >
            Create and link organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewAwsMarketplaceOrgModal
