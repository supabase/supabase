import { zodResolver } from '@hookform/resolvers/zod'
import { parseAsBoolean, useQueryState } from 'nuqs'
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
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useVaultSecretCreateMutation } from '@/data/vault/vault-secret-create-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const formSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your secret'),
  description: z.string().optional(),
  secret: z.string().min(1, 'Please enter your secret value'),
})

type FormSchema = z.infer<typeof formSchema>

const formId = 'add-new-secret-form'
export const AddNewSecretModal = () => {
  const { data: project } = useSelectedProjectQuery()

  const { mutateAsync: addSecret } = useVaultSecretCreateMutation()

  const [showAddSecretModal, setShowAddSecretModal] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )

  const handleClose = () => {
    setShowAddSecretModal(null)
    form.reset()
  }

  const onAddNewSecret: SubmitHandler<FormSchema> = async (values) => {
    if (!project) return console.error('Project is required')

    try {
      await addSecret({
        projectRef: project.ref,
        connectionString: project?.connectionString,
        name: values.name,
        description: values.description,
        secret: values.secret,
      })
      toast.success(`Successfully added new secret ${values.name}`)
      handleClose()
    } catch (error: any) {
      // [Joshen] No error handler required as they are all handled within the mutations already
    } finally {
    }
  }

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', secret: '' },
  })

  const { isDirty, isSubmitting } = form.formState

  return (
    <Dialog open={showAddSecretModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new secret</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              noValidate
              onSubmit={form.handleSubmit(onAddNewSecret)}
              className="space-y-4"
            >
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Name">
                    <FormControl_Shadcn_ className="col-span-6">
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Description" labelOptional="Optional">
                    <FormControl_Shadcn_ className="col-span-6">
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Secret value">
                    <FormControl_Shadcn_ className="col-span-6">
                      <Input reveal copy {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isSubmitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            disabled={!isDirty || isSubmitting}
            loading={isSubmitting}
          >
            Add secret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
