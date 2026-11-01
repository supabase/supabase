import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SidePanel,
  Switch,
} from 'ui'
import { Input as PatternInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { ROLE_PERMISSIONS } from './Roles.constants'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useDatabaseRoleCreateMutation } from '@/data/database-roles/database-role-create-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { generateStrongPassword } from '@/lib/project'

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
  password: z.string().default(''),
})

const initialValues = {
  name: '',
  isSuperuser: false,
  canLogin: false,
  canCreateRole: false,
  canCreateDb: false,
  isReplicationRole: false,
  canBypassRls: false,
  password: '',
}

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

  const canLogin = useWatch({ control: form.control, name: 'canLogin' })
  const [isPasswordGenerated, setIsPasswordGenerated] = useState(false)

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async ({ password, ...values }) => {
    if (!project) return console.error('Project is required')
    // An empty password is omitted so the role is created without one
    const shouldSetPassword = values.canLogin && password.length > 0
    createDatabaseRole({
      projectRef: project.ref,
      connectionString: project.connectionString,
      payload: shouldSetPassword ? { ...values, password } : values,
    })
  }

  const handleClose = () => {
    onClose()
    form.reset(initialValues)
    setIsPasswordGenerated(false)
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      header="Create a new role"
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
      <Form {...form}>
        <form
          id={formId}
          className="grid gap-6 w-full px-8 py-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                <FormLabel className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                  Name
                </FormLabel>
                <FormControl className="col-span-8">
                  <Input {...field} className="w-full" />
                </FormControl>
                <FormMessage className="col-start-5 col-span-8" />
              </FormItem>
            )}
          />
          <div className="grid gap-2 mt-4 md:grid md:grid-cols-12">
            <div className="col-span-4">
              <FormLabel className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                Role privileges
              </FormLabel>
            </div>
            <div className="col-span-8 grid gap-4">
              {(Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[])
                .filter((permissionKey) => ROLE_PERMISSIONS[permissionKey].grant_by_dashboard)
                .map((permissionKey) => {
                  const permission = ROLE_PERMISSIONS[permissionKey]

                  return (
                    <FormField
                      key={permissionKey}
                      control={form.control}
                      name={permissionKey}
                      render={({ field }) => (
                        <FormItem className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                          <div className="col-span-8 flex w-full items-center gap-4 text-sm">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>{permission.description}</FormLabel>
                          </div>
                          <FormMessage className="col-start-5 col-span-8" />
                        </FormItem>
                      )}
                    />
                  )
                })}

              <SidePanel.Separator />

              <div className="grid gap-4">
                <p className="text-sm">These privileges cannot be granted via the Dashboard:</p>
                {(Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[])
                  .filter((permissionKey) => !ROLE_PERMISSIONS[permissionKey].grant_by_dashboard)
                  .map((permissionKey) => {
                    const permission = ROLE_PERMISSIONS[permissionKey]

                    return (
                      <FormField
                        key={permissionKey}
                        control={form.control}
                        name={permissionKey}
                        render={({ field }) => (
                          <FormItem className="space-y-0 opacity-70">
                            <div className="flex w-full items-center gap-4 text-sm">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled
                                  aria-readonly
                                />
                              </FormControl>
                              <FormLabel>{permission.description}</FormLabel>
                            </div>
                            <FormMessage className="col-start-5 col-span-8" />
                          </FormItem>
                        )}
                      />
                    )
                  })}
              </div>
            </div>
          </div>
          {canLogin && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label="Password"
                  description={
                    <>
                      Optional. Without a password, the role can't log in using password
                      authentication.{' '}
                      <button
                        type="button"
                        tabIndex={0}
                        className={InlineLinkClassName}
                        onClick={() => {
                          form.setValue('password', generateStrongPassword(), { shouldDirty: true })
                          setIsPasswordGenerated(true)
                        }}
                      >
                        Generate a password
                      </button>
                      .
                    </>
                  }
                >
                  <FormControl>
                    <PatternInput
                      {...field}
                      onChange={(event) => {
                        field.onChange(event)
                        setIsPasswordGenerated(false)
                      }}
                      copy={field.value.length > 0}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Type in a password"
                    />
                  </FormControl>
                  <span role="status" aria-live="polite" className="sr-only">
                    {isPasswordGenerated ? 'Password generated' : ''}
                  </span>
                </FormItemLayout>
              )}
            />
          )}
        </form>
      </Form>
    </SidePanel>
  )
}
