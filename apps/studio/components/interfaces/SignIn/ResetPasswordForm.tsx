import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import { auth } from 'lib/gotrue'
import { passwordSchema } from 'lib/schemas'
import { Button, Form, Input } from 'ui'

const WHITELIST_ERRORS = [
  'New password should be different from the old password',
  'Password is known to be weak and easy to guess, please choose a different one',
]

const ResetPasswordForm = () => {
  const router = useRouter()

  const onResetPassword = async ({ password }: { password: string }) => {
    const toastId = toast.loading('Saving password...')
    const { error } = await auth.updateUser({ password })

    if (!error) {
      toast.success('Password saved successfully!', { id: toastId })

      // logout all other sessions after changing password
      await auth.signOut({ scope: 'others' })
      await router.push('/projects')
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
      {({ isSubmitting }: { isSubmitting: boolean }) => {
        return (
          <div className="space-y-4 pt-4">
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              disabled={isSubmitting}
              autoComplete="new-password"
            />

            <div className="border-overlay-border border-t" />

            <Button
              block
              form="reset-password-form"
              htmlType="submit"
              size="medium"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save New Password
            </Button>
          </div>
        )
      }}
    </Form>
  )
}

export default ResetPasswordForm
