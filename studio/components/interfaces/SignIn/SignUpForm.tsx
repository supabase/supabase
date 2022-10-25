import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const signUpSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long'),
})

const SignUpForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const onSignUp = async ({ email, password }: { email: string; password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Signing up...`,
    })

    const response = await post(`${API_URL}/signup`, { email, password })
    const error = response.error

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Signed successfully! Please confirm your email before logging in.`,
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
      id="signUp-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={signUpSchema}
      onSubmit={onSignUp}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="flex flex-col gap-4">
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

            <Button
              block
              form="signUp-form"
              htmlType="submit"
              size="large"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Sign Up
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default SignUpForm
