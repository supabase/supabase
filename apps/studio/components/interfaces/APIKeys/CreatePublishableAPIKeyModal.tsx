import { useState } from 'react'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import { useParams } from 'next/navigation'

const FORM_ID = 'create-publishable-api-key'
const SCHEMA = z.object({
  description: z.string(),
})

export interface CreatePublishableAPIKeyModalProps {
  projectRef: string
}

function CreatePublishableAPIKeyModal() {
  const params = useParams()
  const projectRef = params?.ref as string

  const [visible, setVisible] = useState(false)

  const onClose = (value: boolean) => {
    setVisible(value)
  }

  const form = useForm<z.infer<typeof SCHEMA>>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      description: '',
    },
  })

  const { mutate: createAPIKey, isLoading: isCreatingAPIKey } = useAPIKeyCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof SCHEMA>> = async (values) => {
    createAPIKey(
      {
        projectRef,
        type: 'publishable',
        description: values.description.trim(),
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

export default CreatePublishableAPIKeyModal
