import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { Eye, EyeOff } from 'lucide-react'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import Panel from 'components/ui/Panel'

interface AddNewSecretFormProps {
  onComplete?: () => void
}

const AddNewSecretForm = ({ onComplete }: AddNewSecretFormProps) => {
  const { ref: projectRef } = useParams()
  const submitRef = useRef<HTMLButtonElement>(null)
  const [showSecretValue, setShowSecretValue] = useState(false)

  const FormSchema = z.object({
    name: z
      .string()
      .min(1, 'Please provide a name for your secret')
      .refine((value) => !value.match(/^(SUPABASE_).*/), {
        message: 'Name must not start with the SUPABASE_ prefix',
      }),
    value: z.string().min(1, 'Please provider a value for your secret'),
  })
  const defaultValues = { name: '', value: '' }

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { mutate: createSecret, isLoading: isCreating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully created new secret "${variables.secrets[0].name}"`)
      form.reset(defaultValues)
      onComplete?.()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    createSecret({ projectRef, secrets: [data] })
  }

  return (
    <Panel>
      <Panel.Content className="grid gap-4">
        <h2 className="text-sm">Add a new environment variable</h2>
        <Form_Shadcn_ {...form}>
          <form
            id="create-secret-form"
            className="w-full grid grid-cols-2 gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem_Shadcn_ className="w-full">
                  <FormLabel_Shadcn_>Key</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input {...field} placeholder="e.g. CLIENT_KEY" />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem_Shadcn_ className="w-full">
                  <FormLabel_Shadcn_>Value</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input
                      {...field}
                      type={showSecretValue ? 'text' : 'password'}
                      actions={
                        <div className="mr-1">
                          <Button
                            type="default"
                            className="px-1"
                            icon={showSecretValue ? <EyeOff /> : <Eye />}
                            onClick={() => setShowSecretValue(!showSecretValue)}
                          />
                        </div>
                      }
                    />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
            <div className="flex items-center gap-2 col-span-2">
              <Button
                type="primary"
                disabled={isCreating}
                loading={isCreating}
                onClick={() => submitRef?.current?.click()}
              >
                {isCreating ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <button className="hidden" type="submit" ref={submitRef} />
          </form>
        </Form_Shadcn_>
      </Panel.Content>
    </Panel>
  )
}

export default AddNewSecretForm
