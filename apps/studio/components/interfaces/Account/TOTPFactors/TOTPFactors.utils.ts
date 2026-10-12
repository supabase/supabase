type LockoutWarningState = {
  isFactorsSuccess: boolean
  totpFactorsCount: number
  isRecoveryCodesEnabled: boolean
  recoveryCodesStatus:
    | { status: 'unenrolled' | 'available'; data: { remaining: number } | null }
    | undefined
  isRecoveryCodesPending: boolean
  isRecoveryCodesError: boolean
}

export function shouldShowLockoutWarning({
  isFactorsSuccess,
  totpFactorsCount,
  isRecoveryCodesEnabled,
  recoveryCodesStatus,
  isRecoveryCodesPending,
  isRecoveryCodesError,
}: LockoutWarningState) {
  if (!isFactorsSuccess || totpFactorsCount !== 1) return false
  if (!isRecoveryCodesEnabled) return true
  if (isRecoveryCodesPending || isRecoveryCodesError) return false

  return (
    recoveryCodesStatus?.status === 'unenrolled' ||
    (recoveryCodesStatus?.status === 'available' && recoveryCodesStatus.data?.remaining === 0)
  )
}
