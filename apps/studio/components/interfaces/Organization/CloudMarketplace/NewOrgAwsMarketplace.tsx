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
import NewOrgAwsMarketplaceForm, {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
} from './NewOrgAwsMarketplaceForm'

interface Props {
  visible: boolean
  onClose: () => void
  tier: string
  onSuccess: () => void
}

const NewOrgAwsMarketplace = ({ visible, onClose, tier, onSuccess }: Props) => {
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
            A new organization will be created and linked to your AWS Marketplace subscription
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <NewOrgAwsMarketplaceForm tier={tier} onSuccess={onSuccess}></NewOrgAwsMarketplaceForm>
        </DialogSection>
        <DialogFooter>
          <Button
            form={CREATE_AWS_MANAGED_ORG_FORM_ID}
            htmlType="submit"
            loading={false}
            size="medium"
          >
            Create and link organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewOrgAwsMarketplace
