import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useLastSignIn } from 'hooks/misc/useLastSignIn'
import { BASE_PATH } from 'lib/constants'
import { auth, buildPathWithParams } from 'lib/gotrue'
import { Button, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const WHITELIST_ERRORS = ['No SSO provider assigned for this domain']

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
})

const formId = 'sso-sign-in-form'

export const SignInSSOForm = () => {
  const queryClient = useQueryClient()
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [_, setLastSignInUsed] = useLastSignIn()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })
  const isSubmitting = form.formState.isSubmitting

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ email }) => {
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

      if (!WHITELIST_ERRORS.includes(error.message)) {
        Sentry.captureMessage('[CRITICAL] Failed to sign in via SSO: ' + error.message)
      }
    }
  }

  return (
    <Form_Shadcn_ {...form}>
      <form id={formId} className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField_Shadcn_
          key="email"
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout name="email" label="Email">
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...field}
                  placeholder="gavin@hooli.com"
                />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
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

        <Button block form={formId} htmlType="submit" size="large" loading={isSubmitting}>
          Sign In
        </Button>
      </form>
    </Form_Shadcn_>
  )
}
