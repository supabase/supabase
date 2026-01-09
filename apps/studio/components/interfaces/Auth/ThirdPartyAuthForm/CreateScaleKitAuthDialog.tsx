import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useCreateThirdPartyAuthIntegrationMutation } from 'data/third-party-auth/integration-create-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface CreateScaleKitAuthIntegrationProps {
  visible: boolean
  prod?: boolean
  onClose: () => void
  // TODO: Remove this if this Dialog is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-scalekit-auth-integration-form'

const FormSchema = z
  .object({
    enabled: z.boolean(),
    issuerUrl: z.string(),
  })
  .superRefine((val, ctx) => {
    if (!val.issuerUrl.match(/^https:\/\/.+/)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        path: ['issuerUrl'],
        message: 'ScaleKit issuer URL must be a valid HTTPS URL.',
        validation: 'regex',
      })
    }
  })

export const CreateScaleKitAuthIntegrationDialog = ({
  visible,
  onClose,
  onDelete,
}: CreateScaleKitAuthIntegrationProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isPending } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new ScaleKit integration.`)
      onClose()
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
      issuerUrl: '',
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset({
        enabled: true,
        issuerUrl: '',
      })
      // the form input doesn't exist when the form is reset
      setTimeout(() => {
        form.setFocus('issuerUrl')
      }, 25)
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: values.issuerUrl,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">Add new ScaleKit connection</DialogTitle>
        </DialogHeader>

        <Separator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-foreground-light">
                Register your ScaleKit issuer URL. Ensure your ScaleKit instance is configured to
                issue JWTs with a <code className="text-xs">role</code> claim set to{' '}
                <code className="text-xs">authenticated</code> for authenticated users.
              </p>
              <FormField_Shadcn_
                key="issuerUrl"
                control={form.control}
                name="issuerUrl"
                render={({ field }) => (
                  <FormItemLayout label="ScaleKit Issuer URL">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="https://your-tenant.scalekit.com"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button disabled={isPending} type="default" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button form={FORM_ID} htmlType="submit" disabled={isPending} loading={isPending}>
            Create connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
