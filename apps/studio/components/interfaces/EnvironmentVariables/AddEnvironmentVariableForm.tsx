import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { Eye, EyeOff, MinusCircle } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import z from 'zod'

import { DuplicateSecretWarningModal } from '@/components/interfaces/Functions/EdgeFunctionSecrets/DuplicateSecretWarningModal'
import { useSecretsCreateMutation } from '@/data/secrets/secrets-create-mutation'
import { useSecretsQuery } from '@/data/secrets/secrets-query'

type SecretPair = {
  name: string
  value: string
}

const FormSchema = z.object({
  secrets: z.array(
    z.object({
      name: z.string().min(1, 'Please provide a name for your variable'),
      value: z.string().min(1, 'Please provide a value for your variable'),
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

const AddEnvironmentVariableForm = () => {
  const { ref: projectRef } = useParams()
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [duplicateSecretName, setDuplicateSecretName] = useState<string>('')
  const [pendingSecrets, setPendingSecrets] = useState<z.infer<typeof FormSchema> | null>(null)
  const [addKey, setAddKey] = useQueryState('add', parseAsString.withOptions({ history: 'push', clearOnDefault: true }))

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (addKey) {
      form.reset({ secrets: [{ name: addKey, value: '' }] })
      setAddKey(null)
    }
  }, [addKey])

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
      const nonEmptySecrets = currentSecrets.filter((secret) => secret.name || secret.value)
      form.setValue('secrets', [...nonEmptySecrets, ...pairs])
    }
  }

  const { mutate: createSecret, isPending: isCreating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      const count = variables.secrets.length
      toast.success(
        count > 1
          ? `Successfully created ${count} environment variables`
          : `Successfully created new variable "${variables.secrets[0].name}"`
      )
      setTimeout(() => {
        form.reset()
        setVisibleSecrets(new Set())
      }, 0)
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
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
      <Form {...form}>
        <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Add environment variables</CardTitle>
            </CardHeader>
            <CardContent>
              {fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`secrets.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. CLIENT_KEY"
                            data-1p-ignore
                            data-lpignore="true"
                            data-form-type="other"
                            data-bwignore
                            onPaste={(e) => handlePaste(e.nativeEvent)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`secrets.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-full relative">
                        <FormLabel>Value</FormLabel>
                        <FormControl>
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
                                  variant="text"
                                  className="px-1"
                                  icon={isSecretVisible(fieldItem.id) ? <EyeOff /> : <Eye />}
                                  onClick={() => handleToggleSecretVisibility(fieldItem.id)}
                                />
                              </div>
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    variant="default"
                    className="h-[34px] mt-6"
                    icon={<MinusCircle />}
                    disabled={fields.length <= 1}
                    onClick={() => handleRemoveSecret(fieldItem.id, index)}
                  />
                </div>
              ))}

              <Button variant="default" onClick={handleAddAnotherSecret}>
                Add another
              </Button>
            </CardContent>
            <CardFooter className="justify-between space-x-2">
              <p className="text-sm text-foreground-muted">
                Insert or update multiple variables at once by pasting key-value pairs
              </p>

              <Button type="submit" variant="primary" disabled={isCreating} loading={isCreating}>
                {isCreating ? 'Saving...' : fields.length > 1 ? 'Bulk save' : 'Save'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
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

export default AddEnvironmentVariableForm
