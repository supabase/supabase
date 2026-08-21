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
import { SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from 'ui'

import {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
  NewAwsMarketplaceOrgForm,
  type NewMarketplaceOrgForm,
} from './NewAwsMarketplaceOrgForm'
import { useAwsManagedOrganizationCreateMutation } from '@/data/organizations/organization-create-mutation'

interface Props {
  buyerId: string
  visible: boolean
  onSuccess: (newlyCreatedOrgSlug: string) => void
  onClose: () => void
}

export const NewAwsMarketplaceOrgModal = ({ buyerId, visible, onSuccess, onClose }: Props) => {
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
    createOrganization({
      name: values.name,
      kind: values.kind,
      buyerId,
      ...(values.kind === 'COMPANY' ? { size: values.size } : {}),
    })
  }

  return (
    <AwsMarketplaceOrgCreationDialog
      visible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      isCreatingOrganization={isCreatingOrganization}
    />
  )
}

const AwsMarketplaceOrgCreationDialog = ({
  visible,
  onClose,
  onSubmit,
  isCreatingOrganization = false,
}: {
  visible: boolean
  onClose: () => void
  onSubmit: SubmitHandler<NewMarketplaceOrgForm>
  isCreatingOrganization?: boolean
}) => {
  const handleClose = () => {
    if (!isCreatingOrganization) onClose()
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        size="medium"
        onEscapeKeyDown={(e) => {
          if (isCreatingOrganization) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isCreatingOrganization) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Create and link organization</DialogTitle>
          <DialogDescription className="text-balance">
            A new organization will be created and linked to your AWS Marketplace subscription
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <NewAwsMarketplaceOrgForm onSubmit={onSubmit} />
        </DialogSection>
        <DialogFooter>
          <Button
            form={CREATE_AWS_MANAGED_ORG_FORM_ID}
            type="submit"
            loading={isCreatingOrganization}
          >
            Create and link organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
