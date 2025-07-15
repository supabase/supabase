import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { object, string } from 'yup'

import { useResetPasswordMutation } from 'data/misc/reset-password-mutation'
import { BASE_PATH } from 'lib/constants'
import { Button, Form, Input } from 'ui'
import { auth } from 'lib/gotrue'

const forgotPasswordSchema = object({
  email: string().email('Must be a valid email').required('Email is required'),
})

const codeSchema = object({
  code: string().min(6).required('Code is required'),
})

const ForgotPasswordForm = () => {
  const router = useRouter()
  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isCodeInput, setIsCodeInput] = useState(false)

  const { mutate: resetPassword, isLoading } = useResetPasswordMutation({
    onSuccess: () => {
      setIsCodeInput(true)
    },
    onError: (error) => {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      toast.error(`Failed to send reset email: ${error.message}`)
    },
  })

  const onForgotPassword = async ({ email }: { email: string }) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    setEmail(email)

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

  const onCodeEntered = async ({ code }: { code: string }) => {
    const { error } = await auth.verifyOtp({ email, token: code, type: 'recovery' })

    if (error) {
      toast.error(`Failed to verify code: ${error.message}`)
    } else {
      await router.push('reset-password')
    }
  }

  if (isCodeInput && email) {
    return (
      <Form
        key="code"
        validateOnBlur
        id="code-input-form"
        initialValues={{ code: '' }}
        validationSchema={codeSchema}
        onSubmit={onCodeEntered}
      >
        {() => {
          return (
            <div className="flex flex-col pt-4 space-y-4">
              <Input
                id="code"
                name="code"
                label="Code"
                placeholder="123456"
                disabled={isLoading}
                autoComplete="off"
              />

              <div className="border-t border-overlay-border" />

              <Button
                block
                form="code-input-form"
                htmlType="submit"
                size="medium"
                disabled={isLoading}
                loading={isLoading}
              >
                Confirm Reset Code
              </Button>
            </div>
          )
        }}
      </Form>
    )
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
              Send reset code
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default ForgotPasswordForm
