import { auth } from 'lib/gotrue'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const loginSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string().required('Password is required'),
})

const LoginForm = () => {
  const onLogin = async ({ email, password }: { email: string; password: string }) => {
    const result = await auth.signInWithPassword({ email, password })
    console.log('result:', result)
  }

  return (
    <Form
      validateOnBlur
      id="login-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={onLogin}
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
              form="login-form"
              htmlType="submit"
              size="medium"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Login
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default LoginForm
