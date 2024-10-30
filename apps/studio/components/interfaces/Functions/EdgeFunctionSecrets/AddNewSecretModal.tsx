import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Modal } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface AddNewSecretModalProps {
  visible: boolean
  onClose: () => void
}

const AddNewSecretModal = ({ visible, onClose }: AddNewSecretModalProps) => {
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

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    createSecret({ projectRef, secrets: [data] })
  }

  const { mutate: createSecret, isLoading: isCreating } = useSecretsCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully created new secret "${variables.secrets[0].name}"`)
      onClose()
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset(defaultValues)
      setShowSecretValue(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <Modal
      size="small"
      visible={visible}
      onCancel={onClose}
      header="Create a new secret"
      alignFooter="right"
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={isCreating}
            loading={isCreating}
            onClick={() => submitRef?.current?.click()}
          >
            {isCreating ? 'Creating secret' : 'Create secret'}
          </Button>
        </div>
      }
    >
      <Modal.Content>
        <Form_Shadcn_ {...form}>
          <form
            id="create-secret-form"
            className="w-full flex flex-col gap-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout label="Secret name">
                  <FormControl_Shadcn_>
                    <Input {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItemLayout label="Secret value">
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
                </FormItemLayout>
              )}
            />
            <button className="hidden" type="submit" ref={submitRef} />
          </form>
        </Form_Shadcn_>
      </Modal.Content>
    </Modal>
  )
}

export default AddNewSecretModal
