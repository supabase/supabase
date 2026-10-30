import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { LockIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { LastSignInWrapper } from './LastSignInWrapper'
import { resolveCaptchaToken } from './SignIn.utils'
import { useLastSignIn } from '@/hooks/misc/useLastSignIn'
import { BASE_PATH } from '@/lib/constants'
import { captureCriticalError } from '@/lib/error-reporting'
import { auth, buildPathWithParams } from '@/lib/gotrue'
import { classifyApiError, classifyValidationError } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'
import { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
})

const formId = 'sso-sign-in-form'

export const SignInSSOForm = () => {
  const queryClient = useQueryClient()
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isCaptchaFallback, setIsCaptchaFallback] = useState(false)
  const [_, setLastSignInUsed] = useLastSignIn()
  const track = useTrack()
  const trackFunnelError = useTrackFunnelError()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })
  const isSubmitting = form.formState.isSubmitting

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ email }) => {
    const toastId = toast.loading('Signing in...')

    let token = captchaToken
    if (!token) {
      const captcha = await resolveCaptchaToken(captchaRef, trackFunnelError, toastId)
      if (!captcha.ok) {
        setIsCaptchaFallback(true)
        setCaptchaToken(null)
        captchaRef.current?.resetCaptcha()
        return
      }
      token = captcha.token
    }

    // redirects to /sign-in to check if the user has MFA setup (handled in SignInLayout.tsx)
    const redirectTo = buildPathWithParams(
      `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? location.origin
          : process.env.NEXT_PUBLIC_SITE_URL
      }${BASE_PATH}/sign-in-mfa?method=sso`
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
      setLastSignInUsed('sso')
      if (data) {
        // redirect to SSO identity provider page
        window.location.href = data.url
      }
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      toast.error(`Failed to sign in: ${error.message}`, { id: toastId })
      trackFunnelError('signin', classifyApiError('signin', error), 'toast', toastId)
      captureCriticalError(error, 'sign in via SSO')
    }
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        method="POST"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          track('sign_in_submitted', { category: 'account', method: 'sso' })
          return form.handleSubmit(onSubmit, (errors) =>
            trackFunnelError('signin', classifyValidationError('signin', errors), 'form')
          )(e)
        }}
      >
        <FormField
          key="email"
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout label="Email">
              <FormControl>
                <Input type="email" autoComplete="email" {...field} placeholder="gavin@hooli.com" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <div className="self-center">
          <HCaptcha
            key={isCaptchaFallback ? 'interactive' : 'invisible'}
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            size={isCaptchaFallback ? 'normal' : 'invisible'}
            onVerify={(token) => {
              setCaptchaToken(token)
            }}
            onExpire={() => {
              setCaptchaToken(null)
            }}
          />
          {isCaptchaFallback && (
            <p role="status" className="mt-2 max-w-72 text-center text-sm text-foreground-lighter">
              Complete the security check, then select Sign in. If it doesn&apos;t load, allow
              hcaptcha.com in your browser and reload the page.
            </p>
          )}
        </div>

        <Button
          variant="primary"
          block
          form={formId}
          type="submit"
          size="large"
          loading={isSubmitting}
          disabled={isCaptchaFallback && !captchaToken}
        >
          Sign in
        </Button>
      </form>
    </Form>
  )
}

export const SignInWithSSOButton = () => {
  const router = useRouter()

  return (
    <LastSignInWrapper type="sso">
      <Button asChild block size="large" variant="outline" icon={<LockIcon />}>
        <Link href={{ pathname: '/sign-in-sso', query: router.query }}>Continue with SSO</Link>
      </Button>
    </LastSignInWrapper>
  )
}
