import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useSignUpMutation } from 'data/misc/signup-mutation'
import { BASE_PATH } from 'lib/constants'
import { buildPathWithParams } from 'lib/gotrue'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import PasswordConditionsHelper from './PasswordConditionsHelper'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(72, 'Password cannot exceed 72 characters')
    .refine((password) => password.length >= 8, 'Password must be at least 8 characters')
    .refine(
      (password) => /[A-Z]/.test(password),
      'Password must contain at least 1 uppercase character'
    )
    .refine(
      (password) => /[a-z]/.test(password),
      'Password must contain at least 1 lowercase character'
    )
    .refine((password) => /[0-9]/.test(password), 'Password must contain at least 1 number')
    .refine(
      (password) => /[!@#$%^&*()_+\-=\[\]{};`':"\\|,.<>\/?]/.test(password),
      'Password must contain at least 1 symbol'
    ),
})

const formId = 'sign-up-form'

export const SignUpForm = () => {
  const captchaRef = useRef<HCaptcha>(null)
  const [showConditions, setShowConditions] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [passwordHidden, setPasswordHidden] = useState(true)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const [searchParams] = useQueryStates({
    auth_id: parseAsString.withDefault(''),
    token: parseAsString.withDefault(''),
  })

  const { mutate: signup, isPending: isSigningUp } = useSignUpMutation({
    onSuccess: () => {
      toast.success(`Signed up successfully!`)
      setIsSubmitted(true)
    },
    onError: (error) => {
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      toast.error(`Failed to sign up: ${error.message}`)
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ email, password }) => {
    // [Joshen] Separate submitting state as there's 2 async processes here
    let token = captchaToken
    if (!token) {
      const captchaResponse = await captchaRef.current?.execute({ async: true })
      token = captchaResponse?.response ?? null
    }

    const isInsideOAuthFlow = !!searchParams.auth_id
    const redirectUrlBase = `${
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
        ? location.origin
        : process.env.NEXT_PUBLIC_SITE_URL
    }${BASE_PATH}`

    let redirectTo: string

    if (isInsideOAuthFlow) {
      redirectTo = `${redirectUrlBase}/authorize?auth_id=${searchParams.auth_id}${searchParams.token && `&token=${searchParams.token}`}`
    } else {
      // Use getRedirectToPath to handle redirect_to parameter and other query params
      const { returnTo } = router.query
      const basePath = returnTo || '/new' // New users should be redirected to new org creation
      const fullPath = buildPathWithParams(basePath as string)
      const fullRedirectUrl = `${redirectUrlBase}${fullPath}`
      redirectTo = fullRedirectUrl
    }

    signup({
      email,
      password,
      hcaptchaToken: token ?? null,
      redirectTo,
    })
  }

  const password = form.watch('password')
  const isSubmitting = form.formState.isSubmitting || isSigningUp

  return (
    <div className="relative">
      {isSubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute top-0 w-full"
        >
          <Alert_Shadcn_ variant="default">
            <CheckCircle />
            <AlertTitle_Shadcn_>Check your email to confirm</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="text-xs">
              You've successfully signed up. Please check your email to confirm your account before
              signing in to the Supabase dashboard. The confirmation link expires in 10 minutes.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </motion.div>
      )}
      <div
        className={cn(
          'w-full py-1 transition-all duration-500',
          isSubmitted ? 'max-h-[100px] opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'
        )}
      >
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
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                      placeholder="you@example.com"
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              key="password"
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout name="password" label="Password">
                  <FormControl_Shadcn_>
                    <div className="relative">
                      <Input_Shadcn_
                        id="password"
                        type={passwordHidden ? 'password' : 'text'}
                        autoComplete="new-password"
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        {...field}
                        onFocus={() => setShowConditions(true)}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="default"
                        title={passwordHidden ? `Hide password` : `Show password`}
                        aria-label={passwordHidden ? `Hide password` : `Show password`}
                        className="absolute right-1 top-1 px-1.5"
                        icon={passwordHidden ? <Eye /> : <EyeOff />}
                        disabled={isSubmitting}
                        onClick={() => setPasswordHidden((prev) => !prev)}
                      />
                    </div>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <div
              className={`${
                showConditions ? 'max-h-[500px]' : 'max-h-[0px]'
              } transition-all duration-400 overflow-y-hidden`}
            >
              <PasswordConditionsHelper password={password} />
            </div>

            <div className="self-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                size="invisible"
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>

            <Button
              block
              form={formId}
              htmlType="submit"
              size="large"
              disabled={password.length === 0 || isSubmitting}
              loading={isSubmitting}
            >
              Sign up
            </Button>
          </form>
        </Form_Shadcn_>
      </div>
    </div>
  )
}
