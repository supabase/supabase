import { auth } from 'lib/gotrue'
import Link from 'next/link'
import { Button, Form, IconLock, Input } from 'ui'
import { object, string } from 'yup'

const registerSchema = object({
  username: string()
    .max(39, 'Username is too long (maximum is 39 characters)')
    .matches(
      // Username regex is 'borrowed' from GitHub
      /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
      'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen'
    )
    .required('Username is required'),
  email: string().email('Must be a valid email').required('Email is required'),
  password: string().required('Password is required'),
})

const RegisterForm = () => {
  const onRegister = async ({
    username,
    email,
    password,
  }: {
    username: string
    email: string
    password: string
  }) => {
    const result = await auth.signUp({ email, password, options: { data: { username } } })
    console.log('result:', result)
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
              id="username"
              name="username"
              type="text"
              label="Username"
              placeholder="your-username"
            />

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
              size="medium"
              icon={<IconLock />}
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
