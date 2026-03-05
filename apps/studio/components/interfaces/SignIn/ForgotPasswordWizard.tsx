import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResetPasswordMutation } from 'data/misc/reset-password-mutation'
import { BASE_PATH } from 'lib/constants'
import { auth } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Please provide an email address').email('Must be a valid email'),
})

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
type CodeFormData = z.infer<typeof codeSchema>

export const ForgotPasswordWizard = () => {
  const [email, setEmail] = useState('')

  if (email) {
    return <ConfirmResetCodeForm email={email} />
  }

  return <ForgotPasswordForm onSuccess={(email) => setEmail(email)} />
}

const ConfirmResetCodeForm = ({ email }: { email: string }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })

  const onCodeEntered: SubmitHandler<CodeFormData> = async (data) => {
    setIsLoading(true)
    const {
      data: { user },
      error,
    } = await auth.verifyOtp({ email, token: data.code, type: 'recovery' })

    // This fixes a race condition where the user is redirected to the reset password page without the session being set
    // which causes the user to be redirected to /sign-in page even though he's signed in
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (error) {
      setIsLoading(false)
      toast.error(`Failed to verify code: ${error.message}`)
    } else {
      if (user?.factors?.length) {
        await router.push({
          pathname: '/forgot-password-mfa',
          query: router.query,
        })
      } else {
        await router.push({
          pathname: '/reset-password',
          query: router.query,
        })
      }
    }
  }

  return (
    <Form_Shadcn_ {...codeForm}>
      <form
        id="code-input-form"
        className="flex flex-col pt-4 space-y-4"
        onSubmit={codeForm.handleSubmit(onCodeEntered)}
      >
        <Admonition
          type="default"
          title="Check your email for a reset code"
          description="You'll receive an email if an account associated with the email address exists"
        />
        <FormField_Shadcn_
          control={codeForm.control}
          name="code"
          render={({ field }) => (
            <FormItemLayout label="Code">
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  {...field}
                  placeholder="123456"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />

        <div className="border-t border-overlay-border" />

        <Button block form="code-input-form" htmlType="submit" size="medium" loading={isLoading}>
          Confirm reset code
        </Button>
      </form>
    </Form_Shadcn_>
  )
}

const ForgotPasswordForm = ({ onSuccess }: { onSuccess: (email: string) => void }) => {
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { mutate: resetPassword, isPending } = useResetPasswordMutation({
    onSuccess: () => {
      onSuccess(forgotPasswordForm.getValues('email'))
    },
    onError: (error) => {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      toast.error(`Failed to send reset email: ${error.message}`)
    },
  })

  const onForgotPassword: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    resetPassword({
      email: data.email,
      hcaptchaToken: token,
      redirectTo: `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? location.origin
          : process.env.NEXT_PUBLIC_SITE_URL
      }${BASE_PATH}/reset-password`,
    })
  }

  return (
    <Form_Shadcn_ {...forgotPasswordForm}>
      <form
        id="forgot-password-form"
        className="flex flex-col pt-4 space-y-4"
        onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)}
      >
        <FormField_Shadcn_
          control={forgotPasswordForm.control}
          name="email"
          render={({ field }) => (
            <FormItemLayout label="Email">
              <FormControl_Shadcn_>
                <Input_Shadcn_
                  {...field}
                  type="email"
                  placeholder="you@example.com"
                  disabled={isPending}
                  autoComplete="email"
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

        <div className="border-t border-overlay-border" />

        <Button
          block
          form="forgot-password-form"
          htmlType="submit"
          size="medium"
          disabled={isPending}
          loading={isPending}
        >
          Send reset code
        </Button>
      </form>
    </Form_Shadcn_>
  )
}
