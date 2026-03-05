import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { captureCriticalError } from 'lib/error-reporting'
import { auth, getReturnToPath } from 'lib/gotrue'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, cn, Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Separator } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import PasswordConditionsHelper from './PasswordConditionsHelper'

const passwordValidation = z
  .string()
  .min(1, 'Password is required')
  .max(72, 'Password cannot exceed 72 characters')
  .refine((password) => {
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};`':"\\|,.<>\/?]/.test(password)
    const isLongEnough = password.length >= 8

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && isLongEnough
  }, 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character')

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: passwordValidation,
})

const recoveryPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  password: passwordValidation,
})

type FormData = z.infer<typeof passwordSchema>

export const ResetPasswordForm = () => {
  const router = useRouter()
  const { type } = useParams()
  const requireCurrentPassword = type === 'change'

  const [showConditions, setShowConditions] = useState(false)
  const [passwordHidden, setPasswordHidden] = useState(true)
  const [currentPasswordHidden, setCurrentPasswordHidden] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(requireCurrentPassword ? passwordSchema : recoveryPasswordSchema),
    defaultValues: { password: '', currentPassword: '' },
    mode: 'onChange',
  })

  const onResetPassword = async (data: FormData) => {
    const toastId = toast.loading('Saving password...')
    const { error } = await auth.updateUser({
      password: data.password,
      ...(requireCurrentPassword ? { current_password: data.currentPassword } : {}),
    })

    if (!error) {
      toast.success('Password saved successfully!', { id: toastId })

      // logout all other sessions after changing password
      await auth.signOut({ scope: 'others' })
      await router.push(getReturnToPath('/organizations'))
    } else {
      toast.error(`Failed to save password: ${error.message}`, { id: toastId })
      captureCriticalError(error, 'reset password')
    }
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onResetPassword)} className="space-y-4 pt-4">
        {requireCurrentPassword && (
          <FormField_Shadcn_
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItemLayout label="Current password">
                <FormControl_Shadcn_>
                  <Input
                    id="currentPassword"
                    type={currentPasswordHidden ? 'password' : 'text'}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    disabled={form.formState.isSubmitting}
                    actions={
                      <Button
                        icon={currentPasswordHidden ? <Eye /> : <EyeOff />}
                        type="default"
                        className="w-7"
                        onClick={() => setCurrentPasswordHidden((prev) => !prev)}
                      />
                    }
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      setCurrentPasswordHidden(true)
                    }}
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
        )}
        <FormField_Shadcn_
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItemLayout label="Password">
              <FormControl_Shadcn_>
                <Input
                  id="password"
                  type={passwordHidden ? 'password' : 'text'}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  disabled={form.formState.isSubmitting}
                  onFocus={() => setShowConditions(true)}
                  autoComplete="new-password"
                  actions={
                    <Button
                      icon={passwordHidden ? <Eye /> : <EyeOff />}
                      type="default"
                      className="w-7"
                      onClick={() => setPasswordHidden((prev) => !prev)}
                    />
                  }
                  {...field}
                  onBlur={() => {
                    field.onBlur()
                    setPasswordHidden(true)
                  }}
                />
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />

        <div
          className={cn(
            showConditions ? 'max-h-[500px]' : 'max-h-[0px]',
            'transition-all duration-400 overflow-y-hidden'
          )}
        >
          <PasswordConditionsHelper password={form.watch('password')} />
        </div>

        <Separator className="bg-border" />

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
