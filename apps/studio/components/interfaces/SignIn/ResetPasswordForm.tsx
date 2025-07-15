import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'

import { auth } from 'lib/gotrue'
import { passwordSchema } from 'lib/schemas'
import { Button, Form, Input } from 'ui'

import PasswordConditionsHelper from './PasswordConditionsHelper'

const WHITELIST_ERRORS = [
  'New password should be different from the old password',
  'Password is known to be weak and easy to guess, please choose a different one',
]

const ResetPasswordForm = () => {
  const router = useRouter()
  const [showConditions, setShowConditions] = useState(false)
  const [passwordHidden, setPasswordHidden] = useState(true)

  const onResetPassword = async ({ password }: { password: string }) => {
    const toastId = toast.loading('Saving password...')
    const { error } = await auth.updateUser({ password })

    if (!error) {
      toast.success('Password saved successfully!', { id: toastId })

      // logout all other sessions after changing password
      await auth.signOut({ scope: 'others' })
      await router.push('/organizations')
    } else {
      toast.error(`Failed to save password: ${error.message}`, { id: toastId })
      if (!WHITELIST_ERRORS.some((e) => error.message.includes(e))) {
        Sentry.captureMessage('[CRITICAL] Failed to reset password: ' + error.message)
      }
    }
  }

  return (
    <Form
      validateOnBlur
      id="reset-password-form"
      initialValues={{ password: '' }}
      validationSchema={passwordSchema}
      onSubmit={onResetPassword}
    >
      {({ isSubmitting, values }: { isSubmitting: boolean; values: any }) => {
        return (
          <div className="space-y-4 pt-4">
            <Input
              id="password"
              name="password"
              type={passwordHidden ? 'password' : 'text'}
              label="Password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              disabled={isSubmitting}
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
            />

            <div
              className={`${
                showConditions ? 'max-h-[500px]' : 'max-h-[0px]'
              } transition-all duration-400 overflow-y-hidden`}
            >
              <PasswordConditionsHelper password={values.password} />
            </div>

            <div className="border-overlay-border border-t" />

            <Button
              block
              form="reset-password-form"
              htmlType="submit"
              size="medium"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save new password
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default ResetPasswordForm
