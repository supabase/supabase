import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
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
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { findCiOidcProviders, isValidOidcIssuerUrl } from './ThirdPartyAuthForm.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useCreateThirdPartyAuthIntegrationMutation } from '@/data/third-party-auth/integration-create-mutation'
import { DOCS_URL } from '@/lib/constants'

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

  const ciProviders = findCiOidcProviders({
    issuerUrl: useWatch({ control: form.control, name: 'issuerUrl' }),
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
                        <code>/.well-known/openid-configuration</code>
                      </>
                    }
                  >
                    <FormControl>
                      <Input {...field} placeholder="https://login.example.com" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {ciProviders.length > 0 && (
                <Admonition
                  type="warning"
                  title={`${ciProviders.join(' and ')} tokens identify workflows, not end users`}
                  description={
                    <>
                      Third-Party Auth is for signing in your end users. Tokens from a CI/CD service
                      identify workflows and machines. Some of these issuers also sign tokens for
                      every account on the service, so a token from another account can pass
                      authentication unless your RLS policies check a claim such as <code>sub</code>{' '}
                      that identifies your organization or repository. Read{' '}
                      <InlineLink
                        href={`${DOCS_URL}/guides/auth/third-party/custom-oidc#cicd-workflow-identity-issuers`}
                      >
                        how to restrict access
                      </InlineLink>
                      .
                    </>
                  }
                />
              )}
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
