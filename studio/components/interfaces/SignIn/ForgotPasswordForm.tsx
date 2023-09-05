import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

import { useResetPasswordMutation } from 'data/misc/reset-password-mutation'
import { useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'

const forgotPasswordSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
})

const ForgotPasswordForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const { mutate: resetPassword, isLoading } = useResetPasswordMutation({
    onSuccess: async () => {
      ui.setNotification({
        category: 'success',
        message: `If you registered using your email and password, you will receive a password reset email.`,
      })
      await router.push('/sign-in')
    },
    onError: (error) => {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      ui.setNotification({
        category: 'error',
        message: `Failed to send reset email: ${error.message}`,
      })
    },
  })

  const onForgotPassword = async ({ email }: { email: string }) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    resetPassword({
      email,
      hcaptchaToken: token,
      redirectTo: `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? location.origin
          : process.env.NEXT_PUBLIC_SITE_URL
      }${BASE_PATH}/reset-password`,
    })
  }

  return (
    <Form
      validateOnBlur
      id="forgot-password-form"
      initialValues={{ email: '' }}
      validationSchema={forgotPasswordSchema}
      onSubmit={onForgotPassword}
    >
      {() => {
        return (
          <div className="flex flex-col pt-4 space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="email"
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
              disabled={isLoading}
              loading={isLoading}
            >
              Send Reset Email
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default ForgotPasswordForm
