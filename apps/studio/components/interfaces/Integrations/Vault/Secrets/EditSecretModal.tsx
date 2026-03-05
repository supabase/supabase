import { zodResolver } from '@hookform/resolvers/zod'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretUpdateMutation } from 'data/vault/vault-secret-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Eye, EyeOff } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
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
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { useVaultSecretsQuery } from '@/data/vault/vault-secrets-query'

const SecretSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your secret'),
  description: z.string().optional(),
  secret: z.string().min(1, 'Please enter your secret value'),
})

const formId = 'edit-vault-secret-form'

export const EditSecretModal = () => {
  const { data: project } = useSelectedProjectQuery()

  const { data: secrets = [], isSuccess } = useVaultSecretsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [secretIdToEdit, setSelectedSecretToEdit] = useQueryState('edit', parseAsString)
  const secret = secrets.find((secret) => secret.id === secretIdToEdit)

  const [showSecretValue, setShowSecretValue] = useState(false)

  const { data, isPending: isLoadingSecretValue } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref,
      id: secret?.id,
      connectionString: project?.connectionString,
    },
    { enabled: !!project?.ref }
  )

  const values = {
    name: secret?.name ?? '',
    description: secret?.description ?? '',
    secret: secret?.decryptedSecret ?? data ?? '',
  }

  const form = useForm<z.infer<typeof SecretSchema>>({
    resolver: zodResolver(SecretSchema),
    defaultValues: values,
    values,
  })

  const { mutate: updateSecret, isPending: isSubmitting } = useVaultSecretUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SecretSchema>> = async (values) => {
    if (!project) return console.error('Project is required')
    if (!secret) return console.error('Secret is required')

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
            setSelectedSecretToEdit(null)
          },
          onError: (error) => {
            toast.error(`Failed to update secret: ${error.message}`)
          },
        }
      )
    }
  }

  useEffect(() => {
    if (isSuccess && !!secretIdToEdit && !secret) {
      toast('Secret not found')
      setSelectedSecretToEdit(null)
    }
  }, [isSuccess, secretIdToEdit, secret, setSelectedSecretToEdit])

  return (
    <Dialog
      open={!!secret}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          setSelectedSecretToEdit(null)
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
                  setSelectedSecretToEdit(null)
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
