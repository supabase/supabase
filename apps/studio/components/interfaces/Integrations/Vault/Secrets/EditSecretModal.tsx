import { useState } from 'react'
import { EyeOff, Eye } from 'lucide-react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretUpdateMutation } from 'data/vault/vault-secret-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { VaultSecret } from 'types'

interface EditSecretModalProps {
  visible: boolean
  secret: VaultSecret
  onClose: () => void
}

const SecretSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your secret'),
  description: z.string().optional(),
  secret: z.string().min(1, 'Please enter your secret value'),
})

const formId = 'edit-vault-secret-form'

const EditSecretModal = ({ visible, secret, onClose }: EditSecretModalProps) => {
  const [showSecretValue, setShowSecretValue] = useState(false)
  const { data: project } = useSelectedProjectQuery()
  const { data, isLoading: isLoadingSecretValue } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref,
      id: secret.id,
      connectionString: project?.connectionString,
    },
    { enabled: !!project?.ref }
  )
  const values = {
    name: secret.name ?? '',
    description: secret.description ?? '',
    secret: secret.decryptedSecret ?? data ?? '',
  }
  const form = useForm<z.infer<typeof SecretSchema>>({
    resolver: zodResolver(SecretSchema),
    defaultValues: values,
    values,
  })

  const { mutate: updateSecret, isLoading: isSubmitting } = useVaultSecretUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SecretSchema>> = async (values) => {
    if (!project) return console.error('Project is required')

    const payload: Partial<VaultSecret> = {
      secret: values.secret,
    }
    if (values.name !== secret.name) payload.name = values.name
    if (values.description !== secret.description) payload.description = values.description

    if (Object.keys(payload).length > 0) {
      updateSecret(
        {
          projectRef: project.ref,
          connectionString: project?.connectionString,
          id: secret.id,
          ...payload,
        },
        {
          onSuccess: () => {
            toast.success('Successfully updated secret')
            onClose()
          },
          onError: (error) => {
            toast.error(`Failed to update secret: ${error.message}`)
          },
        }
      )
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit secret</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        {isLoadingSecretValue ? (
          <DialogSection>
            <GenericSkeletonLoader />
          </DialogSection>
        ) : (
          <>
            <DialogSection>
              <Form_Shadcn_ {...form}>
                <form
                  id={formId}
                  className="flex flex-col gap-4"
                  autoComplete="off"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField_Shadcn_
                    key="name"
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="name" label="Name">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ id="name" {...field} />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  <FormField_Shadcn_
                    key="description"
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="description"
                        label="Description"
                        labelOptional="Optional"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ id="description" {...field} data-lpignore="true" />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  <FormField_Shadcn_
                    key="secret"
                    name="secret"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="secret" label="Secret value">
                        <FormControl_Shadcn_>
                          <div className="relative">
                            <Input_Shadcn_
                              id="secret"
                              type={showSecretValue ? 'text' : 'password'}
                              {...field}
                              data-lpignore="true"
                            />
                            <Button
                              type="default"
                              title={showSecretValue ? `Hide secret value` : `Show secret value`}
                              aria-label={
                                showSecretValue ? `Hide secret value` : `Show secret value`
                              }
                              className="absolute right-2 top-1 px-3 py-2"
                              icon={showSecretValue ? <EyeOff /> : <Eye />}
                              onClick={() => setShowSecretValue(!showSecretValue)}
                            />
                          </div>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </form>
              </Form_Shadcn_>
            </DialogSection>
            <DialogFooter>
              <Button
                type="default"
                disabled={isSubmitting}
                onClick={() => {
                  form.reset()
                  onClose()
                }}
              >
                Cancel
              </Button>
              <Button form={formId} htmlType="submit" loading={isSubmitting}>
                Update secret
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EditSecretModal
