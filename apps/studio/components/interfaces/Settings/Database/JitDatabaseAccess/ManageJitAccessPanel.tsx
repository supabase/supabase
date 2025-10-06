import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { FormActions } from 'components/ui/Forms/FormActions'
import { useDatabaseRoleCreateMutation } from 'data/database-roles/database-role-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SidePanel,
  Switch,
} from 'ui'

interface ManageJitAccessPanelProps {
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  name: z.string().trim().min(1, 'You must provide a name').default(''),
  isSuperuser: z.boolean().default(false),
  canLogin: z.boolean().default(false),
  canCreateRole: z.boolean().default(false),
  canCreateDb: z.boolean().default(false),
  isReplicationRole: z.boolean().default(false),
  canBypassRls: z.boolean().default(false),
})

const initialValues = {
  name: '',
  isSuperuser: false,
  canLogin: false,
  canCreateRole: false,
  canCreateDb: false,
  isReplicationRole: false,
  canBypassRls: false,
}

export const ManageJitAccessPanel = ({ visible, onClose }: ManageJitAccessPanelProps) => {
  const formId = 'add-jit-access'

  const { data: project } = useSelectedProjectQuery()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const { mutate: createDatabaseRole, isLoading: isCreating } = useDatabaseRoleCreateMutation({
    onSuccess: (_, vars) => {
      toast.success(`Successfully updated user's access: ${vars.payload.name}`)
      handleClose()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!project) return console.error('Project is required')
    // createDatabaseRole({
    //   projectRef: project.ref,
    //   connectionString: project.connectionString,
    //   payload: values,
    // })
  }

  const handleClose = () => {
    onClose()
    form.reset(initialValues)
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      header="Manage user's JIT access"
      className="mr-0 transform transition-all duration-300 ease-in-out"
      loading={false}
      onCancel={handleClose}
      customFooter={
        <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
          <FormActions
            form={formId}
            isSubmitting={isCreating}
            hasChanges={form.formState.isDirty}
            handleReset={handleClose}
          />
        </div>
      }
    >
      <Form_Shadcn_ {...form}>
        <form
          id={formId}
          className="grid gap-6 w-full px-8 py-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField_Shadcn_
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                  Name
                </FormLabel_Shadcn_>
                <FormControl_Shadcn_ className="col-span-8">
                  <Input_Shadcn_ {...field} className="w-full" />
                </FormControl_Shadcn_>
                <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
              </FormItem_Shadcn_>
            )}
          />
          <div className="grid gap-2 mt-4 md:grid md:grid-cols-12">
            <div className="col-span-4">
              <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                Role privileges
              </FormLabel_Shadcn_>
            </div>
            <div className="col-span-8 grid gap-4">
             

              <SidePanel.Separator />

              <div className="grid gap-4">
                <p className="text-sm">These privileges cannot be granted via the Dashboard:</p>
                
              </div>
            </div>
          </div>
        </form>
      </Form_Shadcn_>
    </SidePanel>
  )
}
