import { zodResolver } from '@hookform/resolvers/zod'
import { PropsWithChildren, useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { profileKeys } from '@/data/profile/keys'
import {
  getMfaAuthenticatorAssuranceLevel,
  useAuthenticatorAssuranceLevelQuery,
} from '@/data/profile/mfa-authenticator-assurance-level-query'
import { useMfaChallengeAndVerifyMutation } from '@/data/profile/mfa-challenge-and-verify-mutation'
import { useMfaListFactorsQuery, type MFAFactor } from '@/data/profile/mfa-list-factors-query'

const VerificationSchema = z.object({
  code: z.string().trim().min(1, 'Enter an authentication code'),
  factorId: z.string().min(1, 'Choose an authenticator'),
})
type VerificationValues = z.infer<typeof VerificationSchema>

interface IdentityVerificationProps {
  factorToAvoidId?: string
  onCancel: () => void
  onCheckingChange?: (isChecking: boolean) => void
}

export const IdentityVerification = ({
  factorToAvoidId,
  onCancel,
  onCheckingChange,
  children,
}: PropsWithChildren<IdentityVerificationProps>) => {
  const verificationId = useId()

  const [restoreFocusTo] = useState(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  )
  const [hasVerified, setHasVerified] = useState(false)
  const [error, setError] = useState<{ message: string } | null>(null)

  const assurance = useAuthenticatorAssuranceLevelQuery({
    queryKey: profileKeys.identityVerification(verificationId),
    staleTime: 0,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })
  const isCheckingAssurance = assurance.isFetching

  const isVerified =
    hasVerified ||
    (assurance.isFetchedAfterMount && !assurance.isError && assurance.data?.currentLevel === 'aal2')
  const needsCode =
    !isVerified && assurance.isFetchedAfterMount && !assurance.isError && !assurance.isFetching
  const factors = useMfaListFactorsQuery({ enabled: needsCode })
  const verifiedFactors = (factors.data?.totp ?? []).filter(
    (factor) => factor.status === 'verified'
  )
  const handleVerified = async () => {
    setError(null)
    try {
      const session = await getMfaAuthenticatorAssuranceLevel()
      if (session?.currentLevel !== 'aal2') {
        setError({
          message: 'Verification did not update your session. Enter a new code and try again.',
        })
        return
      }
      setHasVerified(true)
    } catch (error) {
      setError({
        message:
          error instanceof Error ? error.message : 'Unable to check your session. Try again.',
      })
    }
  }
  const readError = assurance.error ?? (needsCode ? factors.error : null)

  useEffect(() => {
    onCheckingChange?.(isCheckingAssurance)
    return () => onCheckingChange?.(false)
  }, [isCheckingAssurance, onCheckingChange])

  return (
    <>
      {isVerified && children}

      <Dialog
        open={!isVerified && (needsCode || !!readError)}
        onOpenChange={(open) => !open && onCancel()}
      >
        <DialogContent
          hideClose
          aria-describedby={undefined}
          className="w-full max-w-none sm:max-w-none md:max-w-none border-0 rounded-none sm:rounded-none shadow-none outline-none data-[state=open]:animate-none data-[state=closed]:animate-none"
          dialogOverlayProps={{ className: 'block p-0 bg-studio backdrop-blur-none' }}
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (!isVerified && restoreFocusTo?.isConnected) restoreFocusTo.focus()
          }}
        >
          <DialogTitle className="sr-only">Identity verification</DialogTitle>
          <InterstitialLayout
            logo={<SupabaseLogo />}
            title="Verify your identity"
            description="We need to make sure it’s you before making sensitive changes."
          >
            <CardContent className="space-y-4 border-b-0 px-6 pb-6">
              {readError && (
                <AlertError
                  subject="Unable to check your identity"
                  error={readError}
                  showInstructions={false}
                  additionalActions={
                    <Button
                      loading={assurance.isFetching || factors.isFetching}
                      onClick={() => {
                        if (assurance.isError) void assurance.refetch()
                        else void factors.refetch()
                      }}
                    >
                      Retry
                    </Button>
                  }
                />
              )}
              {!readError && needsCode && factors.isSuccess && (
                <VerificationForm
                  verifiedFactors={verifiedFactors}
                  factorToAvoidId={factorToAvoidId}
                  error={error}
                  onVerified={handleVerified}
                  onCancel={onCancel}
                />
              )}
              {(readError || factors.isPending) && (
                <Button block onClick={onCancel} variant="text">
                  Cancel
                </Button>
              )}
            </CardContent>
          </InterstitialLayout>
        </DialogContent>
      </Dialog>
    </>
  )
}

const VerificationForm = ({
  verifiedFactors,
  factorToAvoidId,
  error,
  onVerified,
  onCancel,
}: {
  verifiedFactors: MFAFactor[]
  factorToAvoidId?: string
  error: { message: string } | null
  onCancel: () => void
  onVerified: () => Promise<void>
}) => {
  const preferredFactor =
    verifiedFactors.find((factor) => factor.id !== factorToAvoidId) ?? verifiedFactors[0]

  const form = useForm<VerificationValues>({
    resolver: zodResolver(VerificationSchema),
    defaultValues: { code: '', factorId: preferredFactor?.id ?? '' },
  })

  const { mutate: verify, isPending: loading } = useMfaChallengeAndVerifyMutation({
    onSuccess: onVerified,
    onError: (error) => {
      if (error.code === 'mfa_verification_failed') {
        form.setError(
          'code',
          {
            type: 'server',
            message: 'Incorrect code. Enter a new code and try again.',
          },
          { shouldFocus: true }
        )
      } else {
        form.setError('root', { type: 'server', message: error.message })
      }
    },
  })
  const { errors } = form.formState
  const handleVerify = ({ code, factorId }: VerificationValues) => {
    if (loading) return
    form.clearErrors()
    verify({ code, factorId, refreshFactors: false })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
        {verifiedFactors.length > 1 && (
          <FormField
            control={form.control}
            name="factorId"
            render={({ field }) => (
              <FormItemLayout label="Authenticator app">
                <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an authenticator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {verifiedFactors.map((factor) => (
                      <SelectItem key={factor.id} value={factor.id}>
                        {factor.friendly_name || 'Authenticator app'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItemLayout>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItemLayout
              label="Authentication code"
              description={
                verifiedFactors.length === 1
                  ? `From your authenticator app “${preferredFactor?.friendly_name || 'Authenticator app'}”.`
                  : undefined
              }
            >
              <FormControl>
                <Input
                  {...field}
                  onChange={(event) => {
                    form.clearErrors('code')
                    field.onChange(event)
                  }}
                  autoFocus
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  disabled={loading}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        {(error || errors.root) && (
          <p role="alert" className="text-sm text-destructive">
            {error?.message ?? errors.root?.message}
          </p>
        )}

        <div className="space-y-2.5">
          <Button
            block
            type="submit"
            variant="primary"
            loading={loading}
            disabled={verifiedFactors.length === 0}
          >
            Verify
          </Button>
          <Button block type="button" variant="text" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
