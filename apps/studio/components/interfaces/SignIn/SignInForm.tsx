import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthError } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthError } from 'common'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { LastSignInWrapper } from './LastSignInWrapper'
import { AlertError } from '@/components/ui/AlertError'
import { useAddLoginEvent } from '@/data/misc/audit-login-mutation'
import { getMfaAuthenticatorAssuranceLevel } from '@/data/profile/mfa-authenticator-assurance-level-query'
import { useLastSignIn } from '@/hooks/misc/useLastSignIn'
import { captureCriticalError } from '@/lib/error-reporting'
import { auth, buildPathWithParams, getReturnToPath } from '@/lib/gotrue'
import { useTrack } from '@/lib/telemetry/track'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const formId = 'sign-in-form'

export const SignInForm = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [_, setLastSignIn] = useLastSignIn()

  const [passwordHidden, setPasswordHidden] = useState(true)

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })
  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    // Only call getReturnToPath after component mounts client-side
    setReturnTo(getReturnToPath())
  }, [])

  const track = useTrack()
  const { mutate: addLoginEvent } = useAddLoginEvent()

  let forgotPasswordUrl = `/forgot-password`

  if (returnTo && !returnTo.includes('/forgot-password')) {
    forgotPasswordUrl = `${forgotPasswordUrl}?returnTo=${encodeURIComponent(returnTo)}`
  }

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ email, password }) => {
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
        track('sign_in', { category: 'account', method: 'email' })
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
        captureCriticalError(error, 'sign in via EP')
      }
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      if (error.message.toLowerCase() === 'email not confirmed') {
        return toast.error(
          'Your account has not been verified. Please check the verification link sent to your email. If you have not received the email or the link has expired, please sign up again to request a new verification link.',
          { id: toastId }
        )
      }

      toast.error(error.message, { id: toastId })
    }
  }

  const authError = useAuthError()

  return (
    <Form {...form}>
      <form
        id={formId}
        method="POST"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {authError && <AlertError error={authError} subject="Error while signing in" />}
        <FormField
          key="email"
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout name="email" label="Email">
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...field}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <div className="relative">
          <FormField
            key="password"
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout name="password" label="Password">
                <FormControl>
                  <div className="relative">
                    <Input
                      id="password"
                      type={passwordHidden ? 'password' : 'text'}
                      autoComplete="current-password"
                      {...field}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <Button
                      variant="default"
                      title={passwordHidden ? `Show password` : `Hide password`}
                      aria-label={passwordHidden ? `Show password` : `Hide password`}
                      className="absolute right-1 top-1 px-1.5"
                      icon={passwordHidden ? <Eye /> : <EyeOff />}
                      disabled={isSubmitting}
                      onClick={() => setPasswordHidden((prev) => !prev)}
                    />
                  </div>
                </FormControl>
              </FormItemLayout>
            )}
          />

          {/* positioned using absolute instead of labelOptional prop so tabbing between inputs works smoothly */}
          <Link
            href={forgotPasswordUrl}
            className="absolute top-0 right-0 text-sm text-foreground-lighter"
          >
            Forgot password?
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
          <Button block form={formId} type="submit" size="large" loading={isSubmitting}>
            Sign in
          </Button>
        </LastSignInWrapper>
      </form>
    </Form>
  )
}
