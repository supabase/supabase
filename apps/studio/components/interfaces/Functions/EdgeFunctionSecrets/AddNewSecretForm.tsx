import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { Eye, EyeOff, MinusCircle } from 'lucide-react'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

interface AddNewSecretFormProps {
  onComplete?: () => void
}

type SecretPair = {
  name: string
  value: string
}

const AddNewSecretForm = ({ onComplete }: AddNewSecretFormProps) => {
  const { ref: projectRef } = useParams()
  const submitRef = useRef<HTMLButtonElement>(null)
  const [showSecretValue, setShowSecretValue] = useState(false)

  const FormSchema = z.object({
    secrets: z.array(
      z.object({
        name: z
          .string()
          .min(1, 'Please provide a name for your secret')
          .refine((value) => !value.match(/^(SUPABASE_).*/), {
            message: 'Name must not start with the SUPABASE_ prefix',
          }),
        value: z.string().min(1, 'Please provider a value for your secret'),
      })
    ),
  })

  const defaultValues = {
    secrets: [{ name: '', value: '' }],
  }

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'secrets',
  })

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData?.getData('text')
    if (!text) return

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
          pairs.push({
            name: key.trim(),
            value: valueParts.join('=').trim(),
          })
        }
      })
    }

    if (pairs.length) {
      // Replace all fields with new pairs
      form.reset({ secrets: pairs })
    }
  }

  const { mutate: createSecret, isLoading: isCreating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully created new secret "${variables.secrets[0].name}"`)
      // useFieldArray maintains internal state independently of useForm
      // so it retains field state even after calling form.reset().
      // setTimeout avoids a React state update conflict between useFieldArray and form.setValue
      setTimeout(() => {
        form.setValue('secrets', [{ name: '', value: '' }])
      }, 0)

      onComplete?.()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    createSecret({ projectRef, secrets: data.secrets })
  }

  return (
    <Panel>
      <Panel.Content className="grid gap-4">
        <h2 className="text-sm">Add new secrets</h2>
        <Form_Shadcn_ {...form}>
          <form id="create-secret-form" className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-4">
                <FormField_Shadcn_
                  control={form.control}
                  name={`secrets.${index}.name`}
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="w-full">
                      <FormLabel_Shadcn_>Key</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Input
                          {...field}
                          placeholder="e.g. CLIENT_KEY"
                          onPaste={(e) => handlePaste(e.nativeEvent)}
                        />
                      </FormControl_Shadcn_>
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
                          type={showSecretValue ? 'text' : 'password'}
                          actions={
                            <div className="mr-1">
                              <Button
                                type="text"
                                className="px-1"
                                icon={showSecretValue ? <EyeOff /> : <Eye />}
                                onClick={() => setShowSecretValue(!showSecretValue)}
                              />
                            </div>
                          }
                        />
                      </FormControl_Shadcn_>
                      <div className="absolute -bottom-8">
                        <FormMessage_Shadcn_ />
                      </div>
                    </FormItem_Shadcn_>
                  )}
                />

                <Button
                  type="default"
                  className="self-end h-9 flex"
                  icon={<MinusCircle />}
                  onClick={() => (fields.length > 1 ? remove(index) : form.reset(defaultValues))}
                />
              </div>
            ))}

            <Button
              type="default"
              onClick={() => {
                const formValues = form.getValues('secrets')
                const isEmptyForm = formValues.every((field) => !field.name && !field.value)
                if (isEmptyForm) {
                  fields.forEach((_, index) => remove(index))
                  append({ name: '', value: '' })
                } else {
                  append({ name: '', value: '' })
                }
              }}
            >
              Add another
            </Button>

            <div className="flex items-center gap-2 col-span-2 -mx-6 px-6 border-t pt-4 mt-4">
              <Button
                type="primary"
                htmlType="submit"
                form="create-secret-form"
                disabled={isCreating}
                loading={isCreating}
              >
                {isCreating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      </Panel.Content>
    </Panel>
  )
}

export default AddNewSecretForm
