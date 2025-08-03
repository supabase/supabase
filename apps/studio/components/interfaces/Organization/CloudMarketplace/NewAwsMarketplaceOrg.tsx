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
import { Button } from 'ui'
import NewAwsMarketplaceOrgForm, {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
  NewMarketplaceOrgForm,
} from './NewAwsMarketplaceOrgForm'
import { useAwsManagedOrganizationCreateMutation } from '../../../../data/organizations/organization-create-mutation'
import { toast } from 'sonner'
import { SubmitHandler } from 'react-hook-form'

interface Props {
  buyerId: string
  tier: string
  visible: boolean
  onSuccess: () => void
  onClose: () => void
}

const NewAwsMarketplaceOrg = ({ buyerId, tier, visible, onSuccess, onClose }: Props) => {
  const { mutate: createOrganization, isLoading: isCreatingOrganization } =
    useAwsManagedOrganizationCreateMutation({
      onSuccess: (_) => {
        //TODO(thomas): send tracking event
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
        className="p-2"
      >
        <DialogHeader>
          <DialogTitle>Create a new organization</DialogTitle>
          <DialogDescription>
            A new organization will be created and linked to your AWS Marketplace contract
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

export default NewAwsMarketplaceOrg
