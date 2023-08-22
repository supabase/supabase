import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRef, useState } from 'react'
import { Alert, Button, Form, IconEye, IconEyeOff, Input } from 'ui'
import * as yup from 'yup'

import { useSignUpMutation } from 'data/misc/signup-mutation'
import { useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { resetSignInClicks } from 'lib/local-storage'
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

  const { mutate: signup, isLoading: isSigningUp } = useSignUpMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Signed up successfully!`,
      })
      setIsSubmitted(true)
    },
    onError: (error) => {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      ui.setNotification({
        category: 'error',
        message: `Failed to sign up: ${error.message}`,
      })
    },
  })

  const onSignUp = async ({ email, password }: { email: string; password: string }) => {
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    resetSignInClicks()
    signup({
      email,
      password,
      hcaptchaToken: token ?? null,
      redirectTo: `${
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
          ? location.origin
          : process.env.NEXT_PUBLIC_SITE_URL
      }${BASE_PATH}/sign-in`,
    })
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
        {({ values }: { values: any }) => {
          return (
            <div className="flex flex-col gap-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                disabled={isSigningUp}
                autoComplete="email"
              />

              <Input
                id="password"
                name="password"
                type={passwordHidden ? 'password' : 'text'}
                label="Password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                disabled={isSigningUp}
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
                disabled={values.password.length === 0 || isSigningUp}
                loading={isSigningUp}
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
