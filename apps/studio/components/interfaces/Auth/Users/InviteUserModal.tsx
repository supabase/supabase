import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useUserInviteMutation } from '@/data/auth/user-invite-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export type InviteUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const formSchema = z.object({
  email: z.string().min(1, 'Please enter a valid email').email('Please enter a valid email'),
})
const formId = 'invite-user-form'

const InviteUserModal = ({ visible, setVisible }: InviteUserModalProps) => {
  const { ref: projectRef } = useParams()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleToggle = () => setVisible(!visible)
  const { mutate: inviteUser, isPending: isInviting } = useUserInviteMutation({
    onSuccess: (_, variables) => {
      toast.success(`Sent invite email to ${variables.email}`)
      setVisible(false)
    },
  })
  const { can: canInviteUsers } = useAsyncCheckPermissions(
    PermissionAction.AUTH_EXECUTE,
    'invite_user'
  )

  const onInviteUser: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    inviteUser(
      { projectRef, email: values.email },
      {
        onSuccess: () => {
          form.reset()
        },
      }
    )
  }

  return (
    <Modal
      hideFooter
      size="small"
      key="invite-user-modal"
      visible={visible}
      header="Invite a new user"
      onCancel={handleToggle}
    >
      <Form_Shadcn_ {...form}>
        <Modal.Content>
          <form id={formId} onSubmit={form.handleSubmit(onInviteUser)} noValidate>
            <FormField_Shadcn_
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="User email">
                  <FormControl_Shadcn_ className="relative col-span-6">
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </form>
        </Modal.Content>

        <Modal.Content>
          <Button
            form={formId}
            block
            size="small"
            htmlType="submit"
            loading={isInviting}
            disabled={!canInviteUsers || isInviting}
          >
            Invite user
          </Button>
        </Modal.Content>
      </Form_Shadcn_>
    </Modal>
  )
}

export default InviteUserModal
