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
import { values } from 'mobx'

interface CreateClerkAuthIntegrationProps {
  visible: boolean
  prod?: boolean
  onClose: () => void
  // TODO: Remove this if this Dialog is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-firebase-auth-integration-form'

const FormSchema = z
  .object({
    enabled: z.boolean(),
    productionDomain: z.boolean().default(false),
    domain: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.productionDomain) {
      if (!val.domain.match(/https:\/\/clerk([.][a-z0-9-]+){2,}\/?/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          path: ['domain'],
          message:
            'Production Clerk domains use HTTPS and start with the clerk subdomain (https://clerk.example.com)',
          validation: 'regex',
        })
      }
    } else {
      if (!val.domain.match(/https:\/\/[a-z0-9-]+[.]clerk[.]accounts[.]dev\/?$/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_string,
          path: ['domain'],
          message:
            'Development Clerk domains use HTTPS and end with .clerk.accounts.dev (https://example.clerk.accounts.dev)',
          validation: 'regex',
        })
      }
    }
  })

export const CreateClerkAuthIntegrationDialog = ({
  prod,
  visible,
  onClose,
  onDelete,
}: CreateClerkAuthIntegrationProps) => {
  // TODO: Remove this if this Dialog is only used for creating.
  const isCreating = true

  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isLoading } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new Clerk integration.`)
      onClose()
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
      domain: '',
      productionDomain: prod,
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset({
        enabled: true,
        domain: '',
        productionDomain: prod,
      })
      // the form input doesn't exist when the form is reset
      setTimeout(() => {
        form.setFocus('domain')
      }, 25)
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: values.domain,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">
            {isCreating ? `Add new Clerk connection` : `Update existing Clerk connection`}
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
                This will enable a Clerk session token (JWT) from a specific access data from this
                Supabase project.{' '}
              </p>
              <FormField_Shadcn_
                key="domain"
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItemLayout label="Clerk Domain">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder={
                          prod ? 'https://clerk.example.com' : 'https://example.clerk.accounts.dev'
                        }
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
