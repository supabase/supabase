import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
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
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useSchemaCreateMutation } from '@/data/database/schema-create-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface SchemaEditorProps {
  visible: boolean
  onSuccess: (schema: string) => void
  closePanel: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your schema'),
})

type FormSchema = z.infer<typeof formSchema>

export const SchemaEditor = ({ visible, onSuccess, closePanel }: SchemaEditorProps) => {
  const { data: project } = useSelectedProjectQuery()

  const { mutateAsync: createSchema, isPending } = useSchemaCreateMutation()

  const onSubmit: SubmitHandler<FormSchema> = async (values) => {
    if (project === undefined) return console.error('Project is required')
    try {
      await createSchema({
        projectRef: project.ref,
        connectionString: project.connectionString,
        name: values.name,
      })
      onSuccess(values.name)
      toast.success(`Successfully created schema "${values.name}"`)
    } catch (error) {
      toast.error(`Failed to create schema: ${error}`)
    }
  }

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  })

  const { reset } = form

  useEffect(() => {
    if (visible) {
      reset()
    }
  }, [reset, visible])

  const formId = 'schema-form'

  return (
    <Dialog open={visible} onOpenChange={closePanel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new schema</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="grow px-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Schema name">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>
        <DialogFooter>
          <Button
            type="default"
            onClick={() => {
              form.reset()
              closePanel()
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            form={formId}
            htmlType="submit"
            loading={isPending}
            disabled={isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
