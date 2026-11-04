import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useFlag } from 'common'
import { useId, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  CardContent,
  CardFooter,
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

import {
  InterstitialLayout,
  InterstitialLogoBadge,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { AlertError } from '@/components/ui/AlertError'
import { getMfaAuthenticatorAssuranceLevel } from '@/data/profile/mfa-authenticator-assurance-level-query'
import { useMfaChallengeAndVerifyMutation } from '@/data/profile/mfa-challenge-and-verify-mutation'
import { useMfaListFactorsQuery, type MFAFactor } from '@/data/profile/mfa-list-factors-query'

const VerificationSchema = z.object({
  code: z.string().trim().min(1, 'Enter an authentication code'),
  factorId: z.string().min(1, 'Choose an authenticator'),
})
type VerificationValues = z.infer<typeof VerificationSchema>

interface IdentityVerificationProps {
  factorToAvoidId?: string
  canUseRecoveryCodes?: boolean
  returnTo: string
  onCancel: () => void
  children: (verification: { isVerified: boolean; requireVerification: () => void }) => ReactNode
}

export const IdentityVerification = ({
  factorToAvoidId,
  canUseRecoveryCodes = false,
  returnTo,
  onCancel,
  children,
}: IdentityVerificationProps) => {
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')
  const [restoreFocusTo] = useState(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  )
  const [verification, setVerification] = useState<'required' | 'verified' | null>(null)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  const verificationId = useId()
  const assurance = useQuery({
    queryKey: ['identity-verification', verificationId],
    staleTime: 0,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const data = await getMfaAuthenticatorAssuranceLevel()
      return data
    },
  })
  const isVerified =
    verification === 'verified' ||
    (verification === null &&
      assurance.isFetchedAfterMount &&
      !assurance.isError &&
      assurance.data?.currentLevel === 'aal2')
  const needsCode =
    !isVerified &&
    (verification === 'required' ||
      (assurance.isFetchedAfterMount && !assurance.isError && !assurance.isFetching))
  const factors = useMfaListFactorsQuery({ enabled: needsCode })
  const verifiedFactors = (factors.data?.totp ?? []).filter(
    (factor) => factor.status === 'verified'
  )
  const verify = useMfaChallengeAndVerifyMutation({
    onError: setError,
    onSuccess: async () => {
      setIsCheckingSession(true)
      try {
        const session = await getMfaAuthenticatorAssuranceLevel()
        if (session.currentLevel !== 'aal2') {
          setError({
            message: 'Verification did not update your session. Enter a new code and try again.',
          })
          return
        }
        setError(null)
        setVerification('verified')
      } catch (error) {
        setError({
          message:
            error instanceof Error ? error.message : 'Unable to check your session. Try again.',
        })
      } finally {
        setIsCheckingSession(false)
      }
    },
  })
  const loading = verify.isPending || isCheckingSession
  const handleVerify = ({ code, factorId }: VerificationValues) => {
    if (loading) return
    setError(null)
    verify.mutate({ factorId, code, refreshFactors: false })
  }
  const readError = assurance.error ?? (needsCode ? factors.error : null)

  return (
    <>
      {children({
        isVerified,
        requireVerification: () => {
          setError(null)
          setVerification('required')
        },
      })}
      <Dialog open={!isVerified} onOpenChange={(open) => !open && onCancel()}>
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
            logo={
              <div className="relative">
                <SupabaseLogo />
                <InterstitialLogoBadge className="bg-foreground-muted text-background">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 1.5 3 5v6c0 5.6 3.6 9.6 9 11.5 5.4-1.9 9-5.9 9-11.5V5L12 1.5Zm5.2 7.3a1 1 0 0 0-1.4 0L10.5 14l-2.3-2.2a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l6-6a1 1 0 0 0 0-1.4Z"
                    />
                  </svg>
                </InterstitialLogoBadge>
              </div>
            }
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
              {!readError && (!needsCode || factors.isPending) && (
                <p role="status" className="text-sm text-center text-foreground-light">
                  Checking your session…
                </p>
              )}
              {!readError && needsCode && factors.isSuccess && (
                <VerificationForm
                  verifiedFactors={verifiedFactors}
                  factorToAvoidId={factorToAvoidId}
                  canUseRecoveryCodes={enableAuthRecoveryCodes && canUseRecoveryCodes}
                  returnTo={returnTo}
                  loading={loading}
                  error={error}
                  onVerify={handleVerify}
                />
              )}
            </CardContent>
            <CardFooter className="justify-center border-t px-6 py-5">
              <Button onClick={onCancel} variant="text" size="tiny">
                Cancel
              </Button>
            </CardFooter>
          </InterstitialLayout>
        </DialogContent>
      </Dialog>
    </>
  )
}

const VerificationForm = ({
  verifiedFactors,
  factorToAvoidId,
  canUseRecoveryCodes,
  returnTo,
  loading,
  error,
  onVerify,
}: {
  verifiedFactors: MFAFactor[]
  factorToAvoidId?: string
  canUseRecoveryCodes: boolean
  returnTo: string
  loading: boolean
  error: { message: string } | null
  onVerify: (values: VerificationValues) => void
}) => {
  const preferredFactor =
    verifiedFactors.find((factor) => factor.id !== factorToAvoidId) ?? verifiedFactors[0]
  const form = useForm<VerificationValues>({
    resolver: zodResolver(VerificationSchema),
    defaultValues: { code: '', factorId: preferredFactor?.id ?? '' },
  })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onVerify)} className="space-y-4">
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
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItemLayout label="Authentication code">
              <FormControl>
                <Input
                  {...field}
                  autoFocus
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  disabled={loading}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
        {error && (
          <AlertError
            subject="Unable to verify your identity"
            error={error}
            showInstructions={false}
          />
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
          {canUseRecoveryCodes && (
            <Button asChild block variant="text">
              <Link to="/sign-in-recovery-code" search={{ returnTo }}>
                Use recovery code instead
              </Link>
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
