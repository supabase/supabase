import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
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
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
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

  const [isSecretVisible, setIsSecretVisible] = useState(false)

  const [showAddSecretModal, setShowAddSecretModal] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )

  const handleClose = () => {
    setShowAddSecretModal(null)
    setIsSecretVisible(false)
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
          <Form {...form}>
            <form
              id={formId}
              noValidate
              onSubmit={form.handleSubmit(onAddNewSecret)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Name">
                    <FormControl className="col-span-6">
                      <Input {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Description" labelOptional="Optional">
                    <FormControl className="col-span-6">
                      <Input {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Secret value">
                    <FormControl className="col-span-6">
                      <div className="relative">
                        <Textarea
                          {...field}
                          rows={1}
                          ref={(el) => {
                            field.ref(el)
                            if (el) {
                              el.style.height = 'auto'
                              el.style.height = Math.max(40, el.scrollHeight) + 'px'
                            }
                          }}
                          className="min-h-0 resize-none"
                          style={
                            {
                              WebkitTextSecurity: isSecretVisible ? undefined : 'disc',
                            } as React.CSSProperties
                          }
                          onChange={(e) => {
                            field.onChange(e)
                            e.currentTarget.style.height = 'auto'
                            e.currentTarget.style.height =
                              Math.max(40, e.currentTarget.scrollHeight) + 'px'
                          }}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="text"
                              className="absolute right-1 top-1 px-1"
                              aria-label={
                                isSecretVisible ? 'Hide secret value' : 'Show secret value'
                              }
                              icon={isSecretVisible ? <EyeOff /> : <Eye />}
                              onClick={() => setIsSecretVisible((prev) => !prev)}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {isSecretVisible ? 'Hide value' : 'Show value'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </DialogSection>
        <DialogFooter>
          <Button variant="default" disabled={isSubmitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            form={formId}
            type="submit"
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
