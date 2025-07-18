import { isEmpty } from 'lodash'
import { useState, useEffect } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretUpdateMutation } from 'data/vault/vault-secret-update-mutation'
import type { VaultSecret } from 'types'
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
import { EyeOff, Eye } from 'lucide-react'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface EditSecretModalProps {
  selectedSecret: VaultSecret | undefined
  onClose: () => void
}

const SecretSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your secret'),
  description: z.string().optional(),
  secret: z.string().min(1, 'Please enter your secret value'),
})

const EditSecretModal = ({ selectedSecret, onClose }: EditSecretModalProps) => {
  const [showSecretValue, setShowSecretValue] = useState(false)
  const { project } = useProjectContext()
  const formId = 'edit-vault-secret-form'
  const { data, isLoading: isLoadingSecretValue } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref!,
      id: selectedSecret?.id!,
      connectionString: project?.connectionString,
    },
    { enabled: selectedSecret !== undefined && !!(project?.ref && selectedSecret?.id) }
  )
  const form = useForm<z.infer<typeof SecretSchema>>({
    resolver: zodResolver(SecretSchema),
    defaultValues: {
      name: selectedSecret?.name ?? '',
      description: selectedSecret?.description ?? '',
      secret: selectedSecret?.decryptedSecret ?? data ?? '',
    },
    values: {
      name: selectedSecret?.name ?? '',
      description: selectedSecret?.description ?? '',
      secret: selectedSecret?.decryptedSecret ?? data ?? '',
    },
  })

  useEffect(() => {
    if (selectedSecret !== undefined) {
      setShowSecretValue(false)
    }
  }, [selectedSecret])

  const { mutateAsync: updateSecret, isLoading: isSubmitting } = useVaultSecretUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SecretSchema>> = async (values) => {
    if (!project) return console.error('Project is required')

    const payload: Partial<VaultSecret> = {
      secret: values.secret,
    }
    if (values.name !== selectedSecret?.name) payload.name = values.name
    if (values.description !== selectedSecret?.description) payload.description = values.description

    if (!isEmpty(payload) && selectedSecret) {
      updateSecret(
        {
          projectRef: project.ref,
          connectionString: project?.connectionString,
          id: selectedSecret.id,
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
      open={selectedSecret !== undefined}
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
