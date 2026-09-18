import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthError, useFeatureFlags, useFlag } from 'common'
import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
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

export const SignInRecoveryCodeForm = () => {
  const router = useRouter()
  const signOut = useSignOut()
  const queryClient = useQueryClient()
  const { hasLoaded } = useFeatureFlags()
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
    if (hasLoaded && (!enableAuthRecoveryCodes || recoveryCodesStatus?.status === 'unenrolled')) {
      queryClient.resetQueries().then(() => router.push(getReturnToPath()))
    }
  }, [hasLoaded, enableAuthRecoveryCodes, recoveryCodesStatus, router, queryClient])

  const error = useAuthError()

  const [isCodeRevealed, setIsCodeRevealed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

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
            ref={formRef}
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
                  <InputGroup>
                    <FormControl>
                      <FormInputGroupInput
                        {...field}
                        className="pl-10 font-mono"
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        placeholder="****************"
                        type={isCodeRevealed ? 'text' : 'password'}
                        onPaste={(event) => {
                          // If users paste something, it's most probably a valid code so we can safely try submitting it immediately
                          // onPaste is triggered before the paste operation is complete so we have to emulate it to avoid using an unreliable setTimeout
                          event.preventDefault()
                          field.onChange(event.clipboardData.getData('text'))
                          formRef.current?.dispatchEvent(
                            new Event('submit', { cancelable: true, bubbles: true })
                          )
                        }}
                      />
                    </FormControl>
                    <InputGroupAddon align="inline-start">
                      <LockIcon />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end" className="pr-1 has-[>button]:mr-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton
                            aria-label={isCodeRevealed ? 'Hide code' : 'Show code'}
                            aria-describedby={undefined}
                            onClick={() => setIsCodeRevealed((previous) => !previous)}
                          >
                            {isCodeRevealed ? (
                              <EyeIcon className="size-4" />
                            ) : (
                              <EyeOffIcon className="size-4" />
                            )}
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isCodeRevealed ? 'Hide code' : 'Show code'}
                        </TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                </FormItemLayout>
              )}
            />

            <div className="flex items-center justify-between gap-x-2">
              <Button
                block
                variant="outline"
                size="large"
                onClick={onClickLogout}
                disabled={isVerifying || isSuccess}
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
