import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
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
  Form,
  FormControl,
  FormField,
  Input,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { useVaultSecretDecryptedValueQuery } from '@/data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretUpdateMutation } from '@/data/vault/vault-secret-update-mutation'
import { useVaultSecretsQuery } from '@/data/vault/vault-secrets-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { VaultSecret } from '@/types'

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
              <Form {...form}>
                <form
                  id={formId}
                  className="flex flex-col gap-4"
                  autoComplete="off"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    key="name"
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="name" label="Name">
                        <FormControl>
                          <Input id="name" {...field} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  <FormField
                    key="description"
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="description"
                        label="Description"
                        labelOptional="Optional"
                      >
                        <FormControl>
                          <Input id="description" {...field} data-lpignore="true" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  <FormField
                    key="secret"
                    name="secret"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="secret" label="Secret value">
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              id="secret"
                              {...field}
                              rows={1}
                              ref={(el) => {
                                field.ref(el)
                                if (el) {
                                  el.style.height = 'auto'
                                  el.style.height = Math.max(40, el.scrollHeight) + 'px'
                                }
                              }}
                              data-lpignore="true"
                              className="min-h-0 resize-none"
                              style={
                                {
                                  WebkitTextSecurity: showSecretValue ? undefined : 'disc',
                                } as React.CSSProperties
                              }
                              onChange={(e) => {
                                field.onChange(e)
                                e.currentTarget.style.height = 'auto'
                                e.currentTarget.style.height =
                                  Math.max(40, e.currentTarget.scrollHeight) + 'px'
                              }}
                            />
                            <Button
                              variant="default"
                              title={showSecretValue ? `Hide secret value` : `Show secret value`}
                              aria-label={
                                showSecretValue ? `Hide secret value` : `Show secret value`
                              }
                              className="absolute right-1 top-1 w-7"
                              icon={showSecretValue ? <EyeOff /> : <Eye />}
                              onClick={() => setShowSecretValue(!showSecretValue)}
                            />
                          </div>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </form>
              </Form>
            </DialogSection>
            <DialogFooter>
              <Button
                variant="default"
                disabled={isSubmitting}
                onClick={() => {
                  form.reset()
                  setSelectedSecretToEdit(null)
                }}
              >
                Cancel
              </Button>
              <Button form={formId} type="submit" loading={isSubmitting}>
                Update secret
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
