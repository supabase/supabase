import HCaptcha from '@hcaptcha/react-hcaptcha'
import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { object, string } from 'yup'

import { BASE_PATH } from 'lib/constants'
import { auth, buildPathWithParams } from 'lib/gotrue'
import { Button, Form, Input } from 'ui'

const WHITELIST_ERRORS = ['No SSO provider assigned for this domain']

const SignInSSOForm = () => {
  const queryClient = useQueryClient()
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const signInSchema = object({
    email: string().email('Must be a valid email').required('Email is required'),
  })
  const onSignIn = async ({ email }: { email: string }) => {
    const toastId = toast.loading('Signing in...')

    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    // redirects to /sign-in to check if the user has MFA setup (handled in SignInLayout.tsx)
    const redirectTo = buildPathWithParams(
      `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? location.origin
          : process.env.NEXT_PUBLIC_SITE_URL
      }${BASE_PATH}/sign-in-mfa`
    )

    const { data, error } = await auth.signInWithSSO({
      domain: email.split('@')[1],
      options: {
        captchaToken: token ?? undefined,
        redirectTo,
      },
    })

    if (!error) {
      await queryClient.resetQueries()

      if (data) {
        // redirect to SSO identity provider page
        window.location.href = data.url
      }
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      toast.error(`Failed to sign in: ${error.message}`, { id: toastId })

      if (!WHITELIST_ERRORS.includes(error.message)) {
        Sentry.captureMessage('[CRITICAL] Failed to sign in via SSO: ' + error.message)
      }
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
