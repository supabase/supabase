import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { useSecretsQuery } from 'data/secrets/secrets-query'
import { Eye, EyeOff, MinusCircle } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import z from 'zod'

import { DuplicateSecretWarningModal } from './DuplicateSecretWarningModal'

type SecretPair = {
  name: string
  value: string
}

const FormSchema = z.object({
  secrets: z.array(
    z.object({
      name: z
        .string()
        .min(1, 'Please provide a name for your secret')
        .refine((value) => !value.match(/^(SUPABASE_).*/), {
          message: 'Name must not start with the SUPABASE_ prefix',
        }),
      value: z.string().min(1, 'Please provide a value for your secret'),
    })
  ),
})

const defaultValues = {
  secrets: [{ name: '', value: '' }],
}

const removeWrappingQuotes = (str: string): string => {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1)
  }
  return str
}

const AddNewSecretForm = () => {
  const { ref: projectRef } = useParams()
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [duplicateSecretName, setDuplicateSecretName] = useState<string>('')
  const [pendingSecrets, setPendingSecrets] = useState<z.infer<typeof FormSchema> | null>(null)

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'secrets',
  })

  const { data: existingSecrets } = useSecretsQuery({
    projectRef: projectRef,
  })

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData?.getData('text')
    if (!text) return

    // If text doesn't contain '=' and is being pasted into a specific field, handle as single value
    if (!text.includes('=')) {
      const inputName = (e.target as HTMLInputElement).name
      if (inputName?.includes('secrets')) {
        const [_, indexStr, field] = inputName.match(/secrets\.(\d+)\.(\w+)/) || []
        if (indexStr && field) {
          const index = parseInt(indexStr)
          form.setValue(
            `secrets.${index}.${field}` as `secrets.${number}.name` | `secrets.${number}.value`,
            text.trim()
          )
          return
        }
      }
    }

    const pairs: Array<SecretPair> = []

    try {
      const jsonData = JSON.parse(text)
      Object.entries(jsonData).forEach(([key, value]) => {
        pairs.push({ name: key, value: String(value) })
      })
    } catch {
      // Try KEY=VALUE format (multiple lines)
      const lines = text.split(/\n/)
      lines.forEach((line) => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length) {
          const valueStr = valueParts.join('=').trim()
          pairs.push({
            name: key.trim(),
            value: removeWrappingQuotes(valueStr),
          })
        }
      })
    }

    if (pairs.length) {
      const currentSecrets = form.getValues('secrets')
      // Filter out any empty pairs before combining
      const nonEmptySecrets = currentSecrets.filter((secret) => secret.name || secret.value)
      form.setValue('secrets', [...nonEmptySecrets, ...pairs])
    }
  }

  const { mutate: createSecret, isPending: isCreating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully created new secret "${variables.secrets[0].name}"`)
      // RHF recommends using setTimeout/useEffect to reset the form
      setTimeout(() => {
        form.reset()
        setVisibleSecrets(new Set())
      }, 0)
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    // Check for duplicate secret names
    const existingSecretNames = existingSecrets?.map((secret) => secret.name) || []
    const duplicateSecret = data.secrets.find((secret) => existingSecretNames.includes(secret.name))

    if (duplicateSecret) {
      setDuplicateSecretName(duplicateSecret.name)
      setPendingSecrets(data)
      return
    }

    createSecret({ projectRef, secrets: data.secrets })
  }

  const handleConfirmDuplicate = () => {
    if (pendingSecrets) {
      createSecret({ projectRef, secrets: pendingSecrets.secrets })
      setDuplicateSecretName('')
      setPendingSecrets(null)
    }
  }

  const handleCancelDuplicate = () => {
    setDuplicateSecretName('')
    setPendingSecrets(null)
  }

  const handleToggleSecretVisibility = (fieldId: string) => {
    setVisibleSecrets((prev) => {
      const visibleSet = new Set(prev)
      if (visibleSet.has(fieldId)) {
        visibleSet.delete(fieldId)
      } else {
        visibleSet.add(fieldId)
      }
      return visibleSet
    })
  }

  const handleRemoveSecret = (fieldId: string, index: number) => {
    if (fields.length > 1) {
      setVisibleSecrets((prev) => {
        const visibleSet = new Set(prev)
        visibleSet.delete(fieldId)
        return visibleSet
      })
      remove(index)
    } else {
      form.reset(defaultValues)
      setVisibleSecrets(new Set())
    }
  }

  const handleAddAnotherSecret = () => {
    append({ name: '', value: '' })
  }

  const isSecretVisible = (fieldId: string) => visibleSecrets.has(fieldId)

  return (
    <>
      <Form_Shadcn_ {...form}>
        <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Add or replace secrets</CardTitle>
            </CardHeader>
            <CardContent>
              {fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-4">
                  <FormField_Shadcn_
                    control={form.control}
                    name={`secrets.${index}.name`}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="w-full">
                        <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input
                            {...field}
                            placeholder="e.g. CLIENT_KEY"
                            data-1p-ignore
                            data-lpignore="true"
                            data-form-type="other"
                            data-bwignore
                            onPaste={(e) => handlePaste(e.nativeEvent)}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <FormField_Shadcn_
                    control={form.control}
                    name={`secrets.${index}.value`}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="w-full relative">
                        <FormLabel_Shadcn_>Value</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input
                            {...field}
                            type={isSecretVisible(fieldItem.id) ? 'text' : 'password'}
                            data-1p-ignore
                            data-lpignore="true"
                            data-form-type="other"
                            data-bwignore
                            actions={
                              <div className="mr-1">
                                <Button
                                  type="text"
                                  className="px-1"
                                  icon={isSecretVisible(fieldItem.id) ? <EyeOff /> : <Eye />}
                                  onClick={() => handleToggleSecretVisibility(fieldItem.id)}
                                />
                              </div>
                            }
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />

                  <Button
                    type="default"
                    className="h-[34px] mt-6"
                    icon={<MinusCircle />}
                    disabled={fields.length <= 1}
                    onClick={() => handleRemoveSecret(fieldItem.id, index)}
                  />
                </div>
              ))}

              <Button type="default" onClick={handleAddAnotherSecret}>
                Add another
              </Button>
            </CardContent>
            <CardFooter className="justify-between space-x-2">
              <p className="text-sm text-foreground-muted">
                Insert or update multiple secrets at once by pasting key-value pairs
              </p>

              <Button type="primary" htmlType="submit" disabled={isCreating} loading={isCreating}>
                {isCreating ? 'Saving...' : fields.length > 1 ? 'Bulk save' : 'Save'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form_Shadcn_>
      <DuplicateSecretWarningModal
        visible={!!duplicateSecretName}
        onCancel={handleCancelDuplicate}
        onConfirm={handleConfirmDuplicate}
        isCreating={isCreating}
        secretName={duplicateSecretName}
      />
    </>
  )
}

export default AddNewSecretForm
