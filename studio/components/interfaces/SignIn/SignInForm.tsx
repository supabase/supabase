import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useStore } from 'hooks'
import { usePushNext } from 'hooks/misc/useAutoAuthRedirect'
import { auth } from 'lib/gotrue'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useSWRConfig } from 'swr'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const signInSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string().required('Password is required'),
})

const SignInForm = () => {
  const { ui } = useStore()
  const pushNext = usePushNext()
  const { cache } = useSWRConfig()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const onSignIn = async ({ email, password }: { email: string; password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Signing in...`,
    })

    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const { error } = await auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: token ?? undefined },
    })

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Signed in successfully!`,
      })

      // .clear() does actually exist on the cache object, but it's not in the types 🤦🏻
      // @ts-ignore
      cache.clear()

      await pushNext()
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      if (error.message.toLowerCase() === 'email not confirmed') {
        return ui.setNotification({
          id: toastId,
          category: 'error',
          message: 'Account has not been verified, please check the link sent to your email',
        })
      }

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
      id="signIn-form"
      initialValues={{ email: '', password: '' }}
      validationSchema={signInSchema}
      onSubmit={onSignIn}
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
              disabled={isSubmitting}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                disabled={isSubmitting}
                autoComplete="current-password"
              />

              {/* positioned using absolute instead of labelOptional prop so tabbing between inputs works smoothly */}
              <Link href="/forgot-password">
                <a className="text-scale-900 text-sm absolute top-0 right-0">Forgot Password?</a>
              </Link>
            </div>

            <div className="self-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                size="invisible"
                onVerify={(token) => {
                  setCaptchaToken(token)
                }}
                onExpire={() => {
                  setCaptchaToken(null)
                }}
              />
            </div>

            <Button
              block
              form="signIn-form"
              htmlType="submit"
              size="large"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Sign In
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default SignInForm
