import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useParams } from 'common'
import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import { Plus } from 'lucide-react'

const FORM_ID = 'create-secret-api-key'
const SCHEMA = z.object({
  name: z.string(),
  description: z.string().trim(),
  expose_as_env: z.boolean(),
})

const CreateSecretAPIKeyDialog = () => {
  const [visible, setVisible] = useState(false)
  const { ref: projectRef } = useParams()

  const onClose = (value: boolean) => {
    setVisible(value)
  }

  const form = useForm<z.infer<typeof SCHEMA>>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      name: '',
      description: '',
      expose_as_env: true,
    },
  })

  const { mutate: createAPIKey, isLoading: isCreatingAPIKey } = useAPIKeyCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SCHEMA>> = async (values) => {
    createAPIKey(
      {
        projectRef,
        type: 'secret',
        name: values.name,
        description: values.description,
        expose_as_env: values.expose_as_env,
      },
      {
        onSuccess: () => {
          onClose(false)
        },
      }
    )
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button type="default" className="mt-2" icon={<Plus />}>
          Add new Secret key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new secret API key</DialogTitle>
          <DialogDescription className="grid gap-y-2">
            <p>
              Secret API keys are used to authorize requests to your project from servers,
              functions, workers or other backend components of your application.{' '}
            </p>

            <p>
              Keep these keys private. Don't publish them online or commit them to source control.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4">
          <Form_Shadcn_ {...form}>
            <form
              className="flex flex-col gap-4"
              id={FORM_ID}
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Name"
                    description="A short name of lowercase alphanumeric characters and underscore, must start with letter or underscore."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} />
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
                    label="Description"
                    description="Provide a description about what this key is used for."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="(Optional)" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="expose_as_env"
                name="expose_as_env"
                className="flex-row"
                control={form.control}
                render={({ field }) => {
                  const name = form.watch('name').toUpperCase()

                  return (
                    <FormItemLayout
                      label="Expose as environment variable"
                      description={`Will be available as SUPABASE_SECRET_KEY_${name || '<NAME>'} in Edge Functions and other integrations that support them.`}
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          key="expose_as_env"
                          checked={field.value}
                          onCheckedChange={(value) => field.onChange(value)}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )
                }}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button form={FORM_ID} htmlType="submit" loading={isCreatingAPIKey}>
            Create API key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSecretAPIKeyDialog
