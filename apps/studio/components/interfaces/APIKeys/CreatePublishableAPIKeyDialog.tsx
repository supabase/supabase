import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import { useParams } from 'next/navigation'

const FORM_ID = 'create-publishable-api-key'
const SCHEMA = z.object({
  name: z.string(),
  description: z.string().trim(),
})

export interface CreatePublishableAPIKeyDialogProps {
  projectRef: string
}

function CreatePublishableAPIKeyDialog() {
  const params = useParams()
  const projectRef = params?.ref as string

  const [visible, setVisible] = useState(false)

  const onClose = (value: boolean) => {
    setVisible(value)
  }

  const form = useForm<z.infer<typeof SCHEMA>>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const { mutate: createAPIKey, isLoading: isCreatingAPIKey } = useAPIKeyCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SCHEMA>> = async (values) => {
    createAPIKey(
      {
        projectRef,
        type: 'publishable',
        name: values.name,
        description: values.description,
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
        <Button type="default" className="pointer-events-auto">
          Create new
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new publishable API key</DialogTitle>
          <DialogDescription>
            Publishable API keys are used to authorize requests to your project from the web, mobile
            or desktop apps, CLIs or other public components of your application. They are safe to
            be published online and embedded in code.
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
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button form={FORM_ID} htmlType="submit" loading={isCreatingAPIKey}>
            Create Publishable API key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePublishableAPIKeyDialog
