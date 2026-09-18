import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthError, useFlag } from 'common'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import z from 'zod'

import { AlertError } from '@/components/ui/AlertError'
import { useAddLoginEvent } from '@/data/misc/audit-login-mutation'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import { useRecoveryCodesVerifyMutation } from '@/data/recovery-codes/recovery-codes-verify-mutation'
import { useSignOut } from '@/lib/auth'
import { getReturnToPath } from '@/lib/gotrue'
import { useTrack } from '@/lib/telemetry/track'

const schema = z.object({
  code: z.string().min(1, 'Recovery Code is required'),
})

const formId = 'sign-in-recovery-code-form'

const SUPPORT_EMAIL_HREF = `mailto:support@supabase.com?subject=${encodeURIComponent('Unable to sign in via MFA')}`

export const SignInMfaForm = () => {
  const router = useRouter()
  const signOut = useSignOut()
  const queryClient = useQueryClient()
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')
  const {
    data: recoveryCodesStatus,
    isPending: recoveryCodesStatusIsPending,
    isError: recoveryCodesStatusIsError,
    error: recoveryCodesStatusError,
  } = useRecoveryCodesStatusQuery({
    enabled: enableAuthRecoveryCodes,
  })

  const track = useTrack()
  const { mutate: addLoginEvent } = useAddLoginEvent()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  })

  const {
    mutate: verifyRecoveryCode,
    isPending: isVerifying,
    isSuccess,
  } = useRecoveryCodesVerifyMutation({
    onSuccess: async () => {
      track('sign_in', { category: 'account', method: 'recovery-code' })
      addLoginEvent({})

      await queryClient.resetQueries()

      router.push(getReturnToPath())
    },
  })

  const onClickLogout = async () => {
    if (isVerifying) return
    await signOut()
    await router.replace('/sign-in')
  }

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ code }) => {
    if (isVerifying) return
    verifyRecoveryCode({ code })
  }

  useEffect(() => {
    // if users wander into this page and he has no recovery code setup or is on platform where it's not enabled
    if (!enableAuthRecoveryCodes || recoveryCodesStatus?.status === 'unenrolled') {
      queryClient.resetQueries().then(() => router.push(getReturnToPath()))
    }
  }, [enableAuthRecoveryCodes, recoveryCodesStatus, router, queryClient])

  const error = useAuthError()

  if (error) {
    return (
      <AlertError
        error={error}
        subject="Error while signing in"
        hideContactSupport
        additionalActions={
          <>
            <Button asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
            <Button asChild>
              <a href={SUPPORT_EMAIL_HREF}>Email support</a>
            </Button>
          </>
        }
      />
    )
  }

  return (
    <>
      {recoveryCodesStatusIsPending && <GenericSkeletonLoader />}

      {recoveryCodesStatusIsError && (
        <AlertError
          error={recoveryCodesStatusError}
          subject="Failed to retrieve recovery codes status"
          description="Try refreshing your browser. If the issue persists, email support@supabase.com."
          hideContactSupport
        />
      )}

      {recoveryCodesStatus?.status === 'available' && (
        <Form {...form}>
          <form
            id={formId}
            method="POST"
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              key="code"
              name="code"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout name="code" label="Recovery code">
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-light [&_svg]:stroke-[1.5] [&_svg]:h-[20px] [&_svg]:w-[20px]">
                        <Lock />
                      </div>
                      <Input
                        id="code"
                        className="pl-10 font-mono"
                        {...field}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        placeholder="****************"
                        onPaste={() => {
                          // If users pasted a code, it's most probably a complete one so we can submit right away
                          form.handleSubmit(onSubmit)
                        }}
                      />
                    </div>
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <div className="flex items-center justify-between gap-x-2">
              <Button
                block
                variant="outline"
                size="large"
                onClick={onClickLogout}
                loading={isVerifying || isSuccess}
                className="opacity-80 hover:opacity-100 transition"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                block
                form={formId}
                type="submit"
                size="large"
                loading={isVerifying || isSuccess}
              >
                {isVerifying ? 'Verifying' : isSuccess ? 'Signing in' : 'Verify'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <div className="my-8">
        <div className="text-sm">
          <span className="text-foreground-light">Unable to sign in?</span>{' '}
        </div>
        <ul className="list-disc pl-6">
          <li>
            <Link
              href="/logout"
              className="text-sm transition text-foreground-light hover:text-foreground"
            >
              Force sign out and clear cookies
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
