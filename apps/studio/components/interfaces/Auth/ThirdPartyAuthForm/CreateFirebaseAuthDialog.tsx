import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { Trash } from 'lucide-react'
import { useEffect } from 'react'
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
  Input_Shadcn_,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useCreateThirdPartyAuthIntegrationMutation } from '@/data/third-party-auth/integration-create-mutation'

interface CreateFirebaseAuthIntegrationProps {
  visible: boolean
  onClose: () => void
  // TODO: Remove this if this Dialog is only used for creating.
  onDelete: () => void
}

const FORM_ID = 'create-firebase-auth-integration-form'

const FormSchema = z.object({
  enabled: z.boolean(),
  firebaseProjectId: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Za-z0-9-]+$/, 'The project ID contains invalid characters.'), // Only allow alphanumeric characters and hyphens.
})

export const CreateFirebaseAuthIntegrationDialog = ({
  visible,
  onClose,
  onDelete,
}: CreateFirebaseAuthIntegrationProps) => {
  // TODO: Remove this if this Dialog is only used for creating.
  const isCreating = true

  const { ref: projectRef } = useParams()
  const { mutate: createAuthIntegration, isPending } = useCreateThirdPartyAuthIntegrationMutation({
    onSuccess: () => {
      toast.success(`Successfully created a new Firebase Auth integration.`)
      onClose()
    },
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
      firebaseProjectId: '',
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset({
        enabled: true,
        firebaseProjectId: '',
      })
      // the form input doesn't exist when the form is reset
      setTimeout(() => {
        form.setFocus('firebaseProjectId')
      }, 25)
    }
  }, [visible])

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    createAuthIntegration({
      projectRef: projectRef!,
      oidcIssuerUrl: `https://securetoken.google.com/${values.firebaseProjectId}`,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">
            {isCreating
              ? `Add new Firebase Auth connection`
              : `Update existing Firebase Auth connection`}
          </DialogTitle>
        </DialogHeader>

        <Separator />
        <DialogSection>
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Enabled flag can't be changed for now because there's no update API call for integrations */}
              {/* <FormField
              key="enabled"
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItemLayout
                  className="px-8"
                  label={`Enable Firebase Auth Connection`}
                  layout="flex"
                >
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={field.disabled}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            <Separator /> */}

              <p className="text-sm text-foreground-light">
                This will enable a JWT token from a specific Firebase project to access data from
                this Supabase project.
              </p>
              <FormField
                key="firebaseProjectId"
                control={form.control}
                name="firebaseProjectId"
                render={({ field }) => (
                  <FormItemLayout label="Firebase Auth Project ID">
                    <FormControl>
                      <Input_Shadcn_ {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>
        <DialogFooter>
          {!isCreating && (
            <div className="flex-1">
              <Button type="danger" onClick={() => onDelete()} icon={<Trash />}>
                Remove connection
              </Button>
            </div>
          )}

          <Button disabled={isPending} type="default" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button form={FORM_ID} htmlType="submit" disabled={isPending} loading={isPending}>
            {isCreating ? 'Create connection' : 'Update connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
