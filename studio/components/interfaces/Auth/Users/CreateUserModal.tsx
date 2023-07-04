import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useContext } from 'react'
import { Button, Checkbox, Form, IconLock, IconMail, Input, Loading, Modal } from 'ui'

import { useUserCreateMutation } from 'data/auth/user-create-mutation'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCheckPermissions, useStore } from 'hooks'
import { PageContext } from 'pages/project/[ref]/auth/users'

export type CreateUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const CreateUserModal = ({ visible, setVisible }: CreateUserModalProps) => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)
  const projectRef = PageState.projectRef

  const { data, isLoading, isSuccess } = useProjectApiQuery({ projectRef }, { enabled: visible })

  const handleToggle = () => setVisible(!visible)
  const canCreateUsers = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'create_user')

  const validate = (values: any) => {
    const errors: any = {}
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

    if (values.email.length === 0) {
      errors.email = 'Please enter a valid email'
    } else if (!emailValidateRegex.test(values.email)) {
      errors.email = `${values.email} is an invalid email`
    }

    if (!values.password?.trim()) {
      errors.password = 'Please enter a password'
    }

    return errors
  }

  const { mutateAsync: createUser } = useUserCreateMutation({
    async onSuccess() {
      await PageState.fetchData(1)
    },
  })

  const onCreateUser = async (values: any, { setSubmitting }: any) => {
    if (!isSuccess) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create user: Error loading project config`,
      })

      return
    }

    const { protocol, endpoint, serviceApiKey } = data.autoApiService

    setSubmitting(true)

    try {
      await createUser({
        endpoint,
        protocol,
        serviceApiKey,
        user: values,
      })

      ui.setNotification({
        category: 'success',
        message: `Created user: ${values.email}`,
      })

      setVisible(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create user: ${error.message}`,
      })
    }

    setSubmitting(false)
  }

  return (
    <Modal
      closable
      hideFooter
      size="small"
      key="create-user-modal"
      visible={visible}
      header="Create a new user"
      onCancel={handleToggle}
      loading={true}
    >
      <Form
        validateOnBlur={false}
        initialValues={{ email: '', password: '', autoConfirmUser: true }}
        validate={validate}
        onSubmit={onCreateUser}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <Loading active={isLoading}>
            <div className="space-y-6 py-4">
              <Modal.Content>
                <div className="space-y-4">
                  <Input
                    id="email"
                    autoComplete="off"
                    label="User Email"
                    icon={<IconMail />}
                    type="email"
                    name="email"
                    placeholder="user@example.com"
                    disabled={isSubmitting || isLoading}
                  />

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="User Password"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    icon={<IconLock />}
                    disabled={isSubmitting || isLoading}
                    autoComplete="new-password"
                  />

                  <Checkbox
                    value="true"
                    id="autoConfirmUser"
                    name="autoConfirmUser"
                    label="Auto Confirm User?"
                    size="medium"
                    description="Creates the user without sending them a confirmation email"
                    defaultChecked={true}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
              </Modal.Content>

              <Modal.Content>
                <Button
                  block
                  size="small"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={!canCreateUsers || isSubmitting || isLoading}
                >
                  Create user
                </Button>
              </Modal.Content>
            </div>
          </Loading>
        )}
      </Form>
    </Modal>
  )
}

export default observer(CreateUserModal)
