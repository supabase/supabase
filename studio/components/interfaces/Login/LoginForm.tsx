import { useStore } from 'hooks'
import { auth } from 'lib/gotrue'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const loginSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string().required('Password is required'),
})

const LoginForm = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { cache } = useSWRConfig()

  const onLogin = async ({ email, password }: { email: string; password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Logging in...`,
    })

    const { error } = await auth.signInWithPassword({ email, password })

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Logged in successfully!`,
      })

      // .clear() does actually exist on the cache object, but it's not in the types 🤦🏻
      // @ts-ignore
      cache.clear()

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
      id="login-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={onLogin}
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
              labelOptional={
                <Link href="/forgot-password">
                  <a>Forgot Password?</a>
                </Link>
              }
            />

            <Button
              block
              form="login-form"
              htmlType="submit"
              size="large"
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
