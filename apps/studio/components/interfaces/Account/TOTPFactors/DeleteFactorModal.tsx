import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useFlag } from 'common'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { AlertError } from '@/components/ui/AlertError'
import { organizationKeys } from '@/data/organizations/keys'
import { useMfaChallengeAndVerifyMutation } from '@/data/profile/mfa-challenge-and-verify-mutation'
import { getMfaListFactors, type MFAFactor } from '@/data/profile/mfa-list-factors-query'
import { useMfaUnenrollMutation } from '@/data/profile/mfa-unenroll-mutation'
import { useRecoveryCodesUnenrollMutation } from '@/data/recovery-codes/recovery-codes-unenroll'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { auth } from '@/lib/gotrue'

const VerificationSchema = z.object({
  code: z.string().trim().min(1, 'Enter an authentication code'),
  factorId: z.string().min(1, 'Choose an authenticator'),
})
type VerificationValues = z.infer<typeof VerificationSchema>
const verificationDefaults: VerificationValues = { code: '', factorId: '' }

interface DeleteFactorModalProps {
  visible: boolean
  factorId: string | null
  lastFactorToBeDeleted: boolean
  hasRecoveryCodes: boolean
  canUseRecoveryCodes?: boolean
  onClose: () => void
}

export const DeleteFactorModal = ({
  visible,
  factorId,
  lastFactorToBeDeleted,
  hasRecoveryCodes,
  canUseRecoveryCodes = false,
  onClose,
}: DeleteFactorModalProps) => {
  const queryClient = useQueryClient()
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')
  const { lastVisitedOrganization } = useLastVisitedOrganization()
  const [isVerificationRequired, setIsVerificationRequired] = useState(false)
  const [hasRemovedRecoveryCodes, setHasRemovedRecoveryCodes] = useState(false)
  const [isCheckingAssurance, setIsCheckingAssurance] = useState(false)
  const [verifiedFactors, setVerifiedFactors] = useState<MFAFactor[]>([])
  const [error, setError] = useState<{ message: string } | null>(null)
  const form = useForm<VerificationValues>({
    resolver: zodResolver(VerificationSchema),
    defaultValues: verificationDefaults,
  })

  const handleClose = () => {
    setIsVerificationRequired(false)
    setError(null)
    setHasRemovedRecoveryCodes(false)
    form.reset(verificationDefaults)
    onClose()
  }

  const checkAssurance = async () => {
    const { data, error: assuranceError } = await auth.mfa.getAuthenticatorAssuranceLevel()
    if (assuranceError) throw assuranceError
    return data?.currentLevel === 'aal2'
  }

  const prepareVerification = async () => {
    const factors = await getMfaListFactors()
    const verified = factors.totp.filter((factor) => factor.status === 'verified')
    setVerifiedFactors(verified)
    const preferred = verified.find((factor) => factor.id !== factorId) ?? verified[0]
    form.reset({ code: '', factorId: preferred?.id ?? '' })
    setIsVerificationRequired(true)
  }

  const handleRemovalError = async (error: { message: string; code?: string }) => {
    if (error.code !== 'insufficient_aal') {
      setError(error)
      return
    }
    setIsCheckingAssurance(true)
    try {
      await prepareVerification()
      setError({ message: 'Verify your identity before removing this authenticator.' })
    } catch (lookupError) {
      setError({
        message:
          lookupError instanceof Error
            ? lookupError.message
            : 'Unable to load your authenticators. Try again.',
      })
    } finally {
      setIsCheckingAssurance(false)
    }
  }

  const verificationMutation = useMfaChallengeAndVerifyMutation({
    onError: setError,
    onSuccess: async () => {
      setIsCheckingAssurance(true)
      try {
        if (!(await checkAssurance())) {
          setError({
            message: 'Verification did not update your session. Enter a new code and try again.',
          })
          return
        }
        setError(null)
        setIsVerificationRequired(false)
        form.reset(verificationDefaults)
      } catch (error) {
        setError({
          message:
            error instanceof Error ? error.message : 'Unable to check your session. Try again.',
        })
      } finally {
        setIsCheckingAssurance(false)
      }
    },
  })

  const unenrollMFAMutation = useMfaUnenrollMutation({
    onError: handleRemovalError,
    onSuccess: async () => {
      if (lastVisitedOrganization) {
        await queryClient.invalidateQueries({
          queryKey: organizationKeys.members(lastVisitedOrganization),
        })
      }
      toast.success('Authenticator removed')
      handleClose()
    },
  })

  const unenrollRecoveryCodesMutation = useRecoveryCodesUnenrollMutation({
    onError: handleRemovalError,
    onSuccess: () => {
      setHasRemovedRecoveryCodes(true)
      if (factorId) unenrollMFAMutation.mutate({ factorId })
    },
  })

  const loading =
    isCheckingAssurance ||
    verificationMutation.isPending ||
    unenrollMFAMutation.isPending ||
    unenrollRecoveryCodesMutation.isPending
  const handleDelete = async () => {
    if (!factorId || loading) return
    setError(null)
    setIsCheckingAssurance(true)
    try {
      if (!(await checkAssurance())) {
        await prepareVerification()
        return
      }
      // Remove recovery codes before the last authenticator, while the session still has AAL2.
      if (lastFactorToBeDeleted && hasRecoveryCodes && !hasRemovedRecoveryCodes)
        unenrollRecoveryCodesMutation.mutate()
      else unenrollMFAMutation.mutate({ factorId })
    } catch (error) {
      setError({
        message:
          error instanceof Error ? error.message : 'Unable to check your session. Try again.',
      })
    } finally {
      setIsCheckingAssurance(false)
    }
  }
  const handleVerify = form.handleSubmit(({ code, factorId: verificationFactorId }) => {
    if (!verificationFactorId || loading) return
    setError(null)
    verificationMutation.mutate({ factorId: verificationFactorId, code })
  })

  const lastAuthenticatorDescription =
    hasRecoveryCodes && !hasRemovedRecoveryCodes
      ? 'Removing your last authenticator disables MFA and removes your recovery codes.'
      : 'Removing your last authenticator disables MFA.'

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      variant={isVerificationRequired ? 'default' : 'destructive'}
      title={isVerificationRequired ? 'Verify your identity' : 'Remove authenticator'}
      confirmLabel={isVerificationRequired ? 'Verify' : 'Remove'}
      confirmLabelLoading={isVerificationRequired ? 'Verifying' : 'Removing'}
      loading={loading}
      onCancel={handleClose}
      onConfirm={isVerificationRequired ? handleVerify : handleDelete}
      disabled={!factorId}
      alert={
        isVerificationRequired
          ? undefined
          : {
              title: lastFactorToBeDeleted
                ? 'Multi-factor authentication will be disabled'
                : 'This action cannot be undone',
              description: lastFactorToBeDeleted
                ? lastAuthenticatorDescription
                : 'You can no longer use this authenticator to sign in.',
            }
      }
    >
      {error && (
        <AlertError
          subject="Unable to remove authenticator"
          error={error}
          hideContactSupport
          showInstructions={false}
        />
      )}
      {isVerificationRequired && (
        <Form {...form}>
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-foreground-light">
              Enter a code from an available authenticator. You can review the removal again after
              verification.
            </p>
            <FormField
              control={form.control}
              name="factorId"
              render={({ field }) => (
                <FormItemLayout label="Authenticator app">
                  <Select value={field.value} onValueChange={field.onChange}>
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
                    <Input {...field} autoFocus autoComplete="one-time-code" inputMode="numeric" />
                  </FormControl>
                </FormItemLayout>
              )}
            />
            {enableAuthRecoveryCodes && canUseRecoveryCodes && (
              <Button asChild variant="text">
                <Link to="/sign-in-recovery-code" search={{ returnTo: '/account/security' }}>
                  Use a recovery code
                </Link>
              </Button>
            )}
          </form>
        </Form>
      )}
      <p hidden={isVerificationRequired} className="text-sm">
        Before removing this authenticator, consider:
      </p>
      <ul
        hidden={isVerificationRequired}
        className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1"
      >
        {lastFactorToBeDeleted ? (
          <>
            <li>Add another authenticator on a different device first</li>
            <li>Check that you no longer need MFA</li>
            <li>
              You will lose access to any organization that enforces multi-factor authentication
            </li>
            {hasRecoveryCodes && <li>Your recovery codes will be removed too</li>}
          </>
        ) : (
          <>
            <li>Your backup authenticator app is still available to use</li>
            <li>Add another authenticator on a different device as a backup</li>
          </>
        )}
      </ul>
    </ConfirmationModal>
  )
}
