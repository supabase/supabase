import { Dialog, DialogContent, DialogFooter, DialogSection } from '@ui/components/shadcn/ui/dialog'
import { Button } from 'ui'

interface Props {
  visible: boolean
  onClose: () => void
}

const AwsMarketplaceOnboardingSuccessModal = ({ visible, onClose }: Props) => {
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
        hideClose={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogSection>
          <div className="p-4 flex flex-col">
            <h1 className="text-xl mb-4">AWS Marketplace Setup completed</h1>
            <p className="text-foreground-light text-sm">
              The organization is now managed and billed through AWS Marketplace.
            </p>
          </div>
        </DialogSection>
        <DialogFooter>
          <Button size="medium" onClick={onClose}>
            Go to Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AwsMarketplaceOnboardingSuccessModal
