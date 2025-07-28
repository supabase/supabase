import HCaptcha from '@hcaptcha/react-hcaptcha'
import * as Sentry from '@sentry/nextjs'
import type { AuthError } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { object, string } from 'yup'

import { useAddLoginEvent } from 'data/misc/audit-login-mutation'
import { getMfaAuthenticatorAssuranceLevel } from 'data/profile/mfa-authenticator-assurance-level-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLastSignIn } from 'hooks/misc/useLastSignIn'
import { auth, buildPathWithParams, getReturnToPath } from 'lib/gotrue'
import { Button, Form, Input } from 'ui'
import { LastSignInWrapper } from './LastSignInWrapper'

const signInSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
  password: string().required('Password is required'),
})

const SignInForm = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [_, setLastSignIn] = useLastSignIn()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)

  useEffect(() => {
    // Only call getReturnToPath after component mounts client-side
    setReturnTo(getReturnToPath())
  }, [])

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: addLoginEvent } = useAddLoginEvent()

  let forgotPasswordUrl = `/forgot-password`

  if (returnTo && !returnTo.includes('/forgot-password')) {
    forgotPasswordUrl = `${forgotPasswordUrl}?returnTo=${encodeURIComponent(returnTo)}`
  }

  const onSignIn = async ({ email, password }: { email: string; password: string }) => {
    const toastId = toast.loading('Signing in...')

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
      setLastSignIn('email')
      try {
        const data = await getMfaAuthenticatorAssuranceLevel()
        if (data) {
          if (data.currentLevel !== data.nextLevel) {
            toast.success(`You need to provide your second factor authentication`, { id: toastId })
            const url = buildPathWithParams('/sign-in-mfa')
            router.replace(url)
            return
          }
        }

        toast.success(`Signed in successfully!`, { id: toastId })
        sendEvent({
          action: 'sign_in',
          properties: { category: 'account', method: 'email' },
        })
        addLoginEvent({})

        await queryClient.resetQueries()
        // since we're already on the /sign-in page, prevent redirect loops
        let redirectPath = '/organizations'
        if (returnTo && returnTo !== '/sign-in') {
          redirectPath = returnTo
        }
        router.push(redirectPath)
      } catch (error: any) {
        toast.error(`Failed to sign in: ${(error as AuthError).message}`, { id: toastId })
        Sentry.captureMessage('[CRITICAL] Failed to sign in via EP: ' + error.message)
      }
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      if (error.message.toLowerCase() === 'email not confirmed') {
        return toast.error(
          'Account has not been verified, please check the link sent to your email',
          { id: toastId }
        )
      }

      toast.error(error.message, { id: toastId })
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
                href={forgotPasswordUrl}
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

            <LastSignInWrapper type="email">
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
            </LastSignInWrapper>
          </div>
        )
      }}
    </Form>
  )
}

export default SignInForm
