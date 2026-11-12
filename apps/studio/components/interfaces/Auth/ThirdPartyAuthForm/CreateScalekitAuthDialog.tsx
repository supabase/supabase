import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { isValidOidcIssuerUrl } from './ThirdPartyAuthForm.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useCreateThirdPartyAuthIntegrationMutation } from '@/data/third-party-auth/integration-create-mutation'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

interface CreateScalekitAuthDialogProps {
  visible: boolean
  onClose: () => void
}

const FORM_ID = 'create-scalekit-integration-form'

const FormSchema = z.object({
  issuerUrl: z
    .string()
    .trim()
    .min(1, 'Issuer URL is required')
    .refine(isValidOidcIssuerUrl, 'Enter an HTTPS URL without a query string or fragment'),
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { issuerUrl: '' }

export const CreateScalekitAuthDialog = ({ visible, onClose }: CreateScalekitAuthDialogProps) => {
  const { ref: projectRef } = useParams()

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const {
    formState: { isDirty },
  } = form

  const handleClose = () => {
    form.reset(defaultValues)
    onClose()
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: handleClose,
  })

  const { mutate: createAuthIntegration, isPending } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success('Scalekit provider added')
      handleClose()
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    createAuthIntegration({ projectRef: projectRef!, oidcIssuerUrl: values.issuerUrl })
  }

  return (
    <Dialog open={visible} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">Add Scalekit provider</DialogTitle>
        </DialogHeader>
        <Separator />
        <DialogSection>
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-foreground-light">
                The Environment URL is the issuer. Its discovery document at{' '}
                <code>/.well-known/openid-configuration</code> names the signing keys.
              </p>
              <FormField
                control={form.control}
                name="issuerUrl"
                render={({ field }) => (
                  <FormItemLayout
                    label="Issuer URL"
                    description="Enter the HTTPS Environment URL, including a custom domain, with no query or fragment."
                  >
                    <FormControl>
                      <Input {...field} placeholder="https://yourorg.scalekit.com" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>
        <DialogFooter>
          <Button disabled={isPending} onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            form={FORM_ID}
            type="submit"
            disabled={!isDirty || isPending}
            loading={isPending}
          >
            Add provider
          </Button>
        </DialogFooter>
      </DialogContent>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </Dialog>
  )
}
