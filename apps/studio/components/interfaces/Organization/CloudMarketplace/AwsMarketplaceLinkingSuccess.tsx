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
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface Props {
  visible: boolean
  onClose: () => void
}

const AwsMarketplaceLinkingSuccess = ({ visible, onClose }: Props) => {
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
              The organization is now being managed and billed through AWS Marketplace. Billing for
              this organization will appear on your AWS invoice.
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

export default AwsMarketplaceLinkingSuccess
