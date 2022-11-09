import { useStore } from 'hooks'
import { auth } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { Button, Form, Input } from 'ui'
import * as yup from 'yup'
import YupPassword from 'yup-password'

// extend yup with password validation
YupPassword(yup)

const resetPasswordSchema = yup.object({
  password: yup.string().password().required().label('Password'),
})

const ResetPasswordForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const onResetPassword = async ({ password }: { password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Saving password...`,
    })

    const { error } = await auth.updateUser({ password })

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Password saved successfully!`,
      })

      await router.push('/projects')
    } else {
      ui.setNotification({
        id: toastId,
        category: 'error',
        message: error.message,
      })
    }
  }

  return (
    <Form
      validateOnBlur
      id="reset-password-form"
      initialValues={{ password: '' }}
      validationSchema={resetPasswordSchema}
      onSubmit={onResetPassword}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="space-y-4 pt-4">
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              disabled={isSubmitting}
            />

            <div className="border-overlay-border border-t" />

            <Button
              block
              form="reset-password-form"
              htmlType="submit"
              size="medium"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save New Password
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default ResetPasswordForm
