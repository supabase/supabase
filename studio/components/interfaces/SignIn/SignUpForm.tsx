import * as yup from 'yup'
import { useRef, useState } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Alert, Button, Form, IconEye, IconEyeOff, Input } from 'ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { passwordSchema } from 'lib/schemas'
import PasswordConditionsHelper from './PasswordConditionsHelper'

const signUpSchema = passwordSchema.shape({
  email: yup.string().email().required().label('Email'),
})

const SignUpForm = () => {
  const { ui } = useStore()
  const captchaRef = useRef<HCaptcha>(null)
  const [showConditions, setShowConditions] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [passwordHidden, setPasswordHidden] = useState(true)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const onSignUp = async ({ email, password }: { email: string; password: string }) => {
    const toastId = ui.setNotification({
      category: 'loading',
      message: `Signing up...`,
    })

    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const response = await post(`${API_URL}/signup`, {
      email,
      password,
      hcaptchaToken: token ?? null,
      redirectTo: `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? process.env.NEXT_PUBLIC_VERCEL_URL
          : process.env.NEXT_PUBLIC_SITE_URL
      }/sign-in`,
    })
    const error = response.error

    if (!error) {
      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Signed up successfully!`,
      })

      setIsSubmitted(true)
    } else {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()

      ui.setNotification({
        id: toastId,
        category: 'error',
        message: error.message,
      })
    }
  }

  return (
    <div className="relative">
      <div
        className={`absolute top-0 duration-500 delay-300 w-full ${
          isSubmitted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Alert className="w-full" withIcon variant="success" title="Check your email to confirm">
          You've successfully signed up. Please check your email to confirm your account before
          signing in to the Supabase dashboard
        </Alert>
      </div>
      <Form
        validateOnBlur
        id="signUp-form"
        className={`w-full py-1 transition-all overflow-y-hidden duration-500 ${
          isSubmitted ? 'max-h-[100px] opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'
        }`}
        initialValues={{ email: '', password: '' }}
        validationSchema={signUpSchema}
        onSubmit={onSignUp}
      >
        {({ isSubmitting, values }: { isSubmitting: boolean; values: any }) => {
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

              <Input
                id="password"
                name="password"
                type={passwordHidden ? 'password' : 'text'}
                label="Password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                disabled={isSubmitting}
                autoComplete="new-password"
                onFocus={() => setShowConditions(true)}
                actions={
                  <Button
                    icon={passwordHidden ? <IconEye /> : <IconEyeOff />}
                    type="default"
                    className="!mr-1"
                    onClick={() => setPasswordHidden((prev) => !prev)}
                  />
                }
              />

              <div
                className={`${
                  showConditions ? 'max-h-[500px]' : 'max-h-[0px]'
                } transition-all duration-400 overflow-y-hidden`}
              >
                <PasswordConditionsHelper password={values.password} />
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
                form="signUp-form"
                htmlType="submit"
                size="large"
                disabled={values.password.length === 0 || isSubmitting}
                loading={isSubmitting}
              >
                Sign Up
              </Button>
            </div>
          )
        }}
      </Form>
    </div>
  )
}

export default SignUpForm
