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
import { useCreateThirdPartyAuthIntegrationMutation } from '@/data/third-party-auth/integration-create-mutation'

interface CreateCustomOidcIntegrationDialogProps {
  visible: boolean
  onClose: () => void
}

const FORM_ID = 'create-custom-oidc-integration-form'

const FormSchema = z.object({
  issuerUrl: z
    .string()
    .trim()
    .min(1, 'Issuer URL is required')
    .refine(isValidOidcIssuerUrl, 'Enter an HTTPS URL without a query string or fragment'),
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { issuerUrl: '' }

export const CreateCustomOidcIntegrationDialog = ({
  visible,
  onClose,
}: CreateCustomOidcIntegrationDialogProps) => {
  const { ref: projectRef } = useParams()

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const handleClose = () => {
    form.reset(defaultValues)
    onClose()
  }

  const { mutate: createAuthIntegration, isPending } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success('Custom OIDC provider added')
      handleClose()
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    createAuthIntegration({ projectRef: projectRef!, oidcIssuerUrl: values.issuerUrl })
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">Add custom OIDC provider</DialogTitle>
        </DialogHeader>
        <Separator />
        <DialogSection>
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-foreground-light">
                Accept JWTs from any OpenID Connect (OIDC) provider.
              </p>
              <FormField
                control={form.control}
                name="issuerUrl"
                render={({ field }) => (
                  <FormItemLayout
                    label="Issuer URL"
                    description={
                      <>
                        Signing keys are found at the issuer's{' '}
                        <code className="text-code-inline">/.well-known/openid-configuration</code>
                      </>
                    }
                  >
                    <FormControl>
                      <Input {...field} placeholder="https://login.example.com" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>
        <DialogFooter>
          <Button disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            form={FORM_ID}
            type="submit"
            disabled={isPending}
            loading={isPending}
          >
            Add provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
