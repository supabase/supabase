import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, BASE_PATH } from 'lib/constants'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { Button, Form, Input } from 'ui'
import { object, string } from 'yup'

const forgotPasswordSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
})

const ForgotPasswordForm = () => {
  const { ui } = useStore()
  const router = useRouter()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const onForgotPassword = async ({ email }: { email: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Sending password reset email...`,
    })

    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const { error } = await post(`${API_URL}/reset-password`, {
      email,
      hcaptchaToken: token ?? undefined,
      redirectTo: `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : process.env.NEXT_PUBLIC_SITE_URL
      }${BASE_PATH}/reset-password`,
    })

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `If you registered using your email and password, you will receive a password reset email.`,
      })

      await router.push('/sign-in')
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      ui.setNotification({
        id: toastId,
        category: 'error',
        message: `Failed to send reset email: ${error.message}`,
      })
    }
  }

  return (
    <Form
      validateOnBlur
      id="forgot-password-form"
      initialValues={{ email: '' }}
      validationSchema={forgotPasswordSchema}
      onSubmit={onForgotPassword}
    >
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="flex flex-col pt-4 space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              loading={isSubmitting}
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
