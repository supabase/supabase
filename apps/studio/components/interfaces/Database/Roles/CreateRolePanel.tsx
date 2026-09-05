import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import z from 'zod'

import { ROLE_PERMISSIONS } from './Roles.constants'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { useDatabaseRoleCreateMutation } from '@/data/database-roles/database-role-create-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface CreateRolePanelProps {
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

const ROLE_PERMISSION_ENTRIES = [
  ['canLogin', ROLE_PERMISSIONS.canLogin],
  ['canCreateRole', ROLE_PERMISSIONS.canCreateRole],
  ['canCreateDb', ROLE_PERMISSIONS.canCreateDb],
  ['canBypassRls', ROLE_PERMISSIONS.canBypassRls],
  ['isSuperuser', ROLE_PERMISSIONS.isSuperuser],
  ['isReplicationRole', ROLE_PERMISSIONS.isReplicationRole],
] as const

export const CreateRolePanel = ({ visible, onClose }: CreateRolePanelProps) => {
  const formId = 'create-new-role'

  const { data: project } = useSelectedProjectQuery()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const { mutate: createDatabaseRole, isPending: isCreating } = useDatabaseRoleCreateMutation({
    onSuccess: (_, vars) => {
      toast.success(`Successfully created new role: ${vars.payload.name}`)
      handleClose()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!project) return console.error('Project is required')
    createDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      payload: values,
    })
  }

  const handleClose = () => {
    onClose()
    form.reset(initialValues)
  }

  return (
    <Sheet
      open={visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
    >
      <SheetContent size="lg" className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Create a new role</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form id={formId} className="flex-1 overflow-auto" onSubmit={form.handleSubmit(onSubmit)}>
            <SheetSection className="flex flex-col gap-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout id="role-name" layout="horizontal" label="Name">
                    <FormControl>
                      <Input id="role-name" {...field} className="w-full" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              <FormLayout layout="horizontal" label="Role privileges">
                <div className="grid gap-4">
                  {ROLE_PERMISSION_ENTRIES.filter(
                    ([, permission]) => permission.grant_by_dashboard
                  ).map(([permissionKey, permission]) => {
                    const id = `role-${permissionKey}`

                    return (
                      <FormField
                        key={permissionKey}
                        control={form.control}
                        name={permissionKey}
                        render={({ field }) => (
                          <FormItemLayout id={id} layout="flex" label={permission.description}>
                            <FormControl>
                              <Switch
                                id={id}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />
                    )
                  })}

                  <Separator />

                  <div className="grid gap-4">
                    <p className="text-sm">These privileges cannot be granted via the Dashboard:</p>
                    {ROLE_PERMISSION_ENTRIES.filter(
                      ([, permission]) => !permission.grant_by_dashboard
                    ).map(([permissionKey, permission]) => {
                      const id = `role-${permissionKey}`

                      return (
                        <FormField
                          key={permissionKey}
                          control={form.control}
                          name={permissionKey}
                          render={({ field }) => (
                            <FormItemLayout
                              id={id}
                              layout="flex"
                              label={permission.description}
                              className="opacity-70"
                            >
                              <FormControl>
                                <Switch
                                  id={id}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled
                                  aria-readonly
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                      )
                    })}
                  </div>
                </div>
              </FormLayout>
            </SheetSection>
          </form>
        </Form>

        <SheetFooter>
          <FormActions
            form={formId}
            isSubmitting={isCreating}
            hasChanges={form.formState.isDirty}
            handleReset={handleClose}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
