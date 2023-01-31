import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useStore } from 'hooks'
import { auth, getReturnToPath } from 'lib/gotrue'
import { useRef, useState } from 'react'
import { useSWRConfig } from 'swr'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const signInSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
})

const SignInSSOForm = () => {
  const { ui } = useStore()
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

    const { data, error } = await auth.signInWithSSO({
      domain: email.split('@')[1],
      options: {
        captchaToken: token ?? undefined,
        redirectTo: `${
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? process.env.NEXT_PUBLIC_VERCEL_URL
            : process.env.NEXT_PUBLIC_SITE_URL
        }${getReturnToPath()}`,
      },
    })

    if (!error) {
      // .clear() does actually exist on the cache object, but it's not in the types 🤦🏻
      // @ts-ignore
      cache.clear()

      if (data) {
        // redirect to SSO identity provider page
        window.location.href = data.url
      }
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

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
      initialValues={{ email: '' }}
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
              placeholder="gavin@hooli.com"
              disabled={isSubmitting}
            />

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

export default SignInSSOForm
