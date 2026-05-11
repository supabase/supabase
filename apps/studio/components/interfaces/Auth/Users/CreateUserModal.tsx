import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Lock, Mail } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input_Shadcn_,
} from 'ui'
import * as z from 'zod'

import { useUserCreateMutation } from '@/data/auth/user-create-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export type CreateUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const CreateUserFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
  autoConfirmUser: z.boolean(),
})

const CreateUserModal = ({ visible, setVisible }: CreateUserModalProps) => {
  const { ref: projectRef } = useParams()
  const { can: canCreateUsers } = useAsyncCheckPermissions(
    PermissionAction.AUTH_EXECUTE,
    'create_user'
  )

  const { mutate: createUser, isPending: isCreatingUser } = useUserCreateMutation({
    onSuccess(res) {
      toast.success(`Successfully created user: ${res.email}`)
      form.reset({ email: '', password: '', autoConfirmUser: true })
      setVisible(false)
    },
  })

  const onCreateUser: SubmitHandler<z.infer<typeof CreateUserFormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    createUser({ projectRef, user: values })
  }

  const form = useForm<z.infer<typeof CreateUserFormSchema>>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { email: '', password: '', autoConfirmUser: true },
  })

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Create a new user</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form
            id="create-user"
            className="flex flex-col gap-y-4 p-6"
            onSubmit={form.handleSubmit(onCreateUser)}
          >
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <div className="items-center relative">
                      <Mail
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        type="email"
                        name="email"
                        placeholder="user@example.com"
                        disabled={isCreatingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1">
                  <FormLabel>User Password</FormLabel>
                  <FormControl>
                    <div className="items-center relative">
                      <Lock
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        {...field}
                        autoComplete="new-password"
                        type="password"
                        name="password"
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        disabled={isCreatingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="autoConfirmUser"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center gap-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormLabel>Auto Confirm User?</FormLabel>
                </FormItem>
              )}
            />

            <FormLabel>
              <p className="text-sm text-foreground-lighter">
                A confirmation email will not be sent when creating a user via this form.
              </p>
            </FormLabel>

            <Button
              block
              size="small"
              htmlType="submit"
              loading={isCreatingUser}
              disabled={!canCreateUsers || isCreatingUser}
            >
              Create user
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateUserModal
