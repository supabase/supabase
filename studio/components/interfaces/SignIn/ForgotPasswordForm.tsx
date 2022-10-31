import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const forgotPasswordSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
})

const ForgotPasswordForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const onForgotPassword = async ({ email }: { email: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Sending password reset email...`,
    })

    const response = await post(`${API_URL}/reset-password`, { email })
    const error = response.error

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Password reset email sent successfully! Please check your email`,
      })

      await router.push('/sign-in')
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
      id="forgot-password-form"
      initialValues={{ email: '' }}
      validationSchema={forgotPasswordSchema}
      onSubmit={onForgotPassword}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="space-y-4 pt-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
            />

            <div className="border-overlay-border border-t" />

            <Button
              block
              form="forgot-password-form"
              htmlType="submit"
              size="medium"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Send Reset Email
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default ForgotPasswordForm
