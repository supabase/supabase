import { auth } from 'lib/gotrue'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const forgotPasswordSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
})

const ForgotPasswordForm = () => {
  const onForgotPassword = async ({ email }: { email: string }) => {
    const result = await auth.resetPasswordForEmail(email)
    console.log('result:', result)
  }

  return (
    <Form
      validateOnBlur
      id="forgot-password-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={forgotPasswordSchema}
      onSubmit={onForgotPassword}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="mb-4 space-y-4 pt-4">
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
