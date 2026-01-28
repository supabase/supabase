import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertTriangle, ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useUserInviteMutation } from 'data/auth/user-invite-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button, Form, Input, Modal } from 'ui'

export type InviteUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const InviteUserModal = ({ visible, setVisible }: InviteUserModalProps) => {
  const { ref: projectRef } = useParams()

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

  // Fetch auth config to check Site URL
  const { data: authConfig, isLoading: isAuthConfigLoading } = useAuthConfigQuery({ projectRef })
  const siteUrl = authConfig?.SITE_URL || ''
  const isSiteUrlLocalhost = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')
  const isSiteUrlMisconfigured = !isAuthConfigLoading && (!siteUrl || isSiteUrlLocalhost)

  const validate = (values: any) => {
    const errors: any = {}
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    if (values.email.length === 0) {
      errors.email = 'Please enter a valid email'
    } else if (!emailValidateRegex.test(values.email)) {
      errors.email = `${values.email} is an invalid email`
    }

    return errors
  }

  const onInviteUser = async (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    inviteUser({ projectRef, email: values.email })
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
      <Form
        validateOnBlur={false}
        initialValues={{ email: '' }}
        validate={validate}
        onSubmit={onInviteUser}
      >
        {() => (
          <>
            {isSiteUrlMisconfigured && (
              <Modal.Content>
                <Alert_Shadcn_ variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>Site URL not configured</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Your Site URL is not configured or set to localhost. Invite links will not work for external users.{' '}
                    <Link
                      href={`/project/${projectRef}/auth/url-configuration`}
                      className="text-foreground underline inline-flex items-center gap-1"
                      onClick={handleToggle}
                    >
                      Configure Site URL <ArrowRight className="h-3 w-3" />
                    </Link>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              </Modal.Content>
            )}

            <Modal.Content>
              <Input
                id="email"
                className="w-full"
                label="User email"
                icon={<Mail />}
                type="email"
                name="email"
                placeholder="User email"
              />
            </Modal.Content>

            <Modal.Content>
              <Button
                block
                size="small"
                htmlType="submit"
                loading={isInviting}
                disabled={!canInviteUsers || isInviting}
              >
                Invite user
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default InviteUserModal
