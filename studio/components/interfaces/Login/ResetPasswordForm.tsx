import { useStore } from 'hooks'
import { auth } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const resetPasswordSchema = object({
  password: string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long'),
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
          <div className="mb-4 space-y-4 pt-4">
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
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
