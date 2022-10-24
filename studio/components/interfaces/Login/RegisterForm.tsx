import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const registerSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long'),
})

const RegisterForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const onRegister = async ({ email, password }: { email: string; password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Registering...`,
    })

    const response = await post(`${API_URL}/signup`, { email, password, username: email })
    const error = response.error

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Registered successfully! Please confirm your email before logging in.`,
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
      id="register-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={registerSchema}
      onSubmit={onRegister}
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
              form="register-form"
              htmlType="submit"
              size="large"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Register
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default RegisterForm
