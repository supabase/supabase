import HCaptcha from '@hcaptcha/react-hcaptcha'
import * as Sentry from '@sentry/nextjs'
import { AuthError } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { object, string } from 'yup'

import { getMfaAuthenticatorAssuranceLevel } from 'data/profile/mfa-authenticator-assurance-level-query'
import { useStore } from 'hooks'
import { auth, buildPathWithParams, getReturnToPath } from 'lib/gotrue'
import { incrementSignInClicks } from 'lib/local-storage'
import { Button, Form, Input } from 'ui'

const signInSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string().required('Password is required'),
})

const SignInForm = () => {
  const { ui } = useStore()
  const router = useRouter()
  const queryClient = useQueryClient()

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
      const signInClicks = incrementSignInClicks()
      if (signInClicks > 1) {
        Sentry.captureMessage('Sign in without previous sign out detected')
      }

      try {
        const data = await getMfaAuthenticatorAssuranceLevel()
        if (data) {
          if (data.currentLevel !== data.nextLevel) {
            ui.setNotification({
              id: toastId,
              category: 'success',
              message: `You need to provide your second factor authentication.`,
            })
            const url = buildPathWithParams('/sign-in-mfa')
            router.replace(url)
            return
          }
        }

        ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Signed in successfully!`,
        })

        await queryClient.resetQueries()

        router.push(getReturnToPath())
      } catch (error) {
        ui.setNotification({
          id: toastId,
          category: 'error',
          message: (error as AuthError).message,
        })
      }
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
              <Link
                href="/forgot-password"
                className="absolute top-0 right-0 text-sm text-foreground-lighter"
              >
                Forgot Password?
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
