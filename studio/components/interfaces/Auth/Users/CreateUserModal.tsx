import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useContext, useState } from 'react'
import { Button, Checkbox, Form, IconLock, IconMail, IconPlus, Input, Loading, Modal } from 'ui'

import { useUserCreateMutation } from 'data/auth/user-create-mutation'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { checkPermissions, useStore } from 'hooks'
import { PageContext } from 'pages/project/[ref]/auth/users'

const CreateUserModal = () => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)
  const projectRef = PageState.projectRef

  const [visible, setVisible] = useState(false)

  const { data, isLoading, isSuccess } = useProjectApiQuery({ projectRef }, { enabled: visible })

  const handleToggle = () => setVisible(!visible)
  const canCreateUsers = checkPermissions(PermissionAction.AUTH_EXECUTE, 'create_user')

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
    <div>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Button as="span" onClick={handleToggle} icon={<IconPlus />} disabled={!canCreateUsers}>
            Create
          </Button>
        </Tooltip.Trigger>

        {!canCreateUsers && (
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                You need additional permissions to create users
              </span>
            </div>
          </Tooltip.Content>
        )}
      </Tooltip.Root>

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
          validateOnBlur
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
                      autoFocus
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
    </div>
  )
}

export default observer(CreateUserModal)
