import { zodResolver } from '@hookform/resolvers/zod'
import { Trash } from 'lucide-react'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
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

interface CreateAuth0IntegrationProps {
  visible: boolean
  onClose: () => void
  // TODO: Remove this if this Dialog is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-auth0-auth-integration-form'

const FormSchema = z.object({
  enabled: z.boolean(),
  auth0DomainName: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Za-z0-9-.]+$/, 'Project IDs should only have alphanumeric characters and hyphens.'), // Only allow alphanumeric characters and hyphens.
})

export const CreateAuth0IntegrationDialog = ({
  visible,
  onClose,
  onDelete,
}: CreateAuth0IntegrationProps) => {
  // TODO: Remove this if this Dialog is only used for creating.
  const isCreating = true

  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isLoading } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new Auth0 Auth integration.`)
      onClose()
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
      auth0DomainName: '',
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset({
        enabled: true,
        auth0DomainName: '',
      })

      // the form input doesn't exist when the form is reset
      setTimeout(() => {
        form.setFocus('auth0DomainName')
      }, 25)
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: `https://${values.auth0DomainName}.auth0.com`,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">
            {isCreating ? `Add new Auth0 connection` : `Update existing Auth0 connection`}
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
                  label={`Enable Auth0 Auth Connection`}
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
                This will enable a JWT token from your Auth0 project to access data from this
                Supabase project.
              </p>
              <FormField_Shadcn_
                key="auth0DomainName"
                control={form.control}
                name="auth0DomainName"
                render={({ field }) => (
                  <FormItemLayout label="Auth0 domain name">
                    <div className="flex flex-row">
                      <Button
                        type="default"
                        size="small"
                        className="px-2 text-foreground-light rounded-r-none"
                        onClick={() => form.setFocus('auth0DomainName')}
                      >
                        https://
                      </Button>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          className="border-l-0 rounded-none border-r-0 z-50"
                          {...field}
                        />
                      </FormControl_Shadcn_>
                      <Button
                        type="default"
                        size="small"
                        className="px-2 text-foreground-light rounded-l-none"
                        onClick={() => form.setFocus('auth0DomainName')}
                      >
                        .auth0.com
                      </Button>
                    </div>
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
