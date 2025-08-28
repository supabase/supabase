import { zodResolver } from '@hookform/resolvers/zod'
import { Trash } from 'lucide-react'
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

interface CreateWorkOSIntegrationProps {
  visible: boolean
  onClose: () => void
  // TODO: Remove this if this Dialog is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-work-os-integration-form'

const WORKOS_ISSUER =
  /^https:\/\/(api.workos.com|[a-zA-Z0-9-]+([.][a-zA-Z0-9-]+){2,})\/(sso|user_management)\/(client|project)_[0-7][0-9A-HJKMNP-TV-Z]{25}\/?$/

const FormSchema = z.object({
  enabled: z.boolean(),
  issuerURL: z
    .string()
    .trim()
    .min(1)
    .regex(
      WORKOS_ISSUER,
      'WorkOS URL contains invalid characters or does not have the correct structure.'
    ),
})

export const CreateWorkOSIntegrationDialog = ({
  visible,
  onClose,
  onDelete,
}: CreateWorkOSIntegrationProps) => {
  // TODO: Remove this if this Dialog is only used for creating.
  const isCreating = true

  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isLoading } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new WorkOS integration.`)
      onClose()
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
      issuerURL: '',
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset({
        enabled: true,
        issuerURL: '',
      })
      // the form input doesn't exist when the form is reset
      setTimeout(() => {
        form.setFocus('issuerURL')
      }, 25)
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: values.issuerURL,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">
            {isCreating ? `Add new WorkOS connection` : `Update existing WorkOS connection`}
          </DialogTitle>
        </DialogHeader>

        <Separator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Enabled flag can't be changed for now because there's no update API call for integrations */}
              {/* <FormField_Shadcn_
              key="enabled"
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItemLayout
                  className="px-8"
                  label={`Enable Firebase Auth Connection`}
                  layout="flex"
                >
                  <FormControl_Shadcn_>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={field.disabled}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <Separator /> */}

              <p className="text-sm text-foreground-light">
                Enables a JWT from WorkOS to access data from this Supabase project.
              </p>
              <FormField_Shadcn_
                key="issuerURL"
                control={form.control}
                name="issuerURL"
                render={({ field }) => (
                  <FormItemLayout
                    label="WorkOS Issuer URL"
                    description="Obtain your issuer URL from the WorkOS dashboard."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="https://api.workos.com/user_management/client_ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          {!isCreating && (
            <div className="flex-1">
              <Button type="danger" onClick={() => onDelete()} icon={<Trash />}>
                Remove connection
              </Button>
            </div>
          )}

          <Button disabled={isLoading} type="default" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button form={FORM_ID} htmlType="submit" disabled={isLoading} loading={isLoading}>
            {isCreating ? 'Create connection' : 'Update connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
