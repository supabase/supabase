import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { auth, getReturnToPath } from 'lib/gotrue'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input,
} from 'ui'

import PasswordConditionsHelper from './PasswordConditionsHelper'

const WHITELIST_ERRORS = [
  'New password should be different from the old password',
  'Password is known to be weak and easy to guess, please choose a different one',
]

// Convert the existing yup passwordSchema to Zod
const passwordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(72, 'Password cannot exceed 72 characters')
    .refine((password) => {
      // Basic password validation - you can enhance this based on your requirements
      const hasUppercase = /[A-Z]/.test(password)
      const hasLowercase = /[a-z]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};`':"\\|,.<>\/?]/.test(password)
      const isLongEnough = password.length >= 8

      return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && isLongEnough
    }, 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'),
})

type FormData = z.infer<typeof passwordSchema>

const ResetPasswordForm = () => {
  const router = useRouter()
  const [showConditions, setShowConditions] = useState(false)
  const [passwordHidden, setPasswordHidden] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
    },
    mode: 'onChange',
  })

  const onResetPassword = async (data: FormData) => {
    const toastId = toast.loading('Saving password...')
    const { error } = await auth.updateUser({ password: data.password })

    if (!error) {
      toast.success('Password saved successfully!', { id: toastId })

      // logout all other sessions after changing password
      await auth.signOut({ scope: 'others' })
      await router.push(getReturnToPath('/organizations'))
    } else {
      toast.error(`Failed to save password: ${error.message}`, { id: toastId })
      if (!WHITELIST_ERRORS.some((e) => error.message.includes(e))) {
        Sentry.captureMessage('[CRITICAL] Failed to reset password: ' + error.message)
      }
    }
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onResetPassword)} className="space-y-4 pt-4">
        <FormField_Shadcn_
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem_Shadcn_>
              <FormControl_Shadcn_>
                <Input
                  id="password"
                  type={passwordHidden ? 'password' : 'text'}
                  label="Password"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  disabled={form.formState.isSubmitting}
                  onFocus={() => setShowConditions(true)}
                  autoComplete="new-password"
                  actions={
                    <Button
                      icon={passwordHidden ? <Eye /> : <EyeOff />}
                      type="default"
                      className="!mr-1"
                      onClick={() => setPasswordHidden((prev) => !prev)}
                    />
                  }
                  {...field}
                />
              </FormControl_Shadcn_>
              <FormMessage_Shadcn_ />
            </FormItem_Shadcn_>
          )}
        />

        <div
          className={`${
            showConditions ? 'max-h-[500px]' : 'max-h-[0px]'
          } transition-all duration-400 overflow-y-hidden`}
        >
          <PasswordConditionsHelper password={form.watch('password')} />
        </div>

        <div className="border-overlay-border border-t" />

        <Button
          block
          htmlType="submit"
          size="medium"
          disabled={form.formState.isSubmitting}
          loading={form.formState.isSubmitting}
        >
          Save new password
        </Button>
      </form>
    </Form_Shadcn_>
  )
}

export default ResetPasswordForm
