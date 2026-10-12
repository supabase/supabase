import { AuthError, AuthMFARecoveryCodesGenerateResponseData } from '@supabase/auth-js'
import { useMutation } from '@tanstack/react-query'
import { ComponentProps } from 'react'

import { RecoveryCodesFlow } from '../TOTPFactors/RecoveryCodesFlow'

// Deliberately invalid codes. This preview never calls the authentication service.
const PREVIEW_CODES = Array.from(
  { length: 4 },
  (_, index) => `PREVIEW-NOT-A-VALID-RECOVERY-CODE-0${index + 1}`
)

export const PreviewRecoveryCodesFlow = (
  props: Omit<ComponentProps<typeof RecoveryCodesFlow>, 'mutation' | 'onGenerate'>
) => {
  const mutation = useMutation<AuthMFARecoveryCodesGenerateResponseData, AuthError>({
    mutationFn: async () => ({
      id: 'local-preview',
      type: 'recovery_code',
      total: PREVIEW_CODES.length,
      codes: PREVIEW_CODES,
    }),
  })
  return <RecoveryCodesFlow {...props} mutation={mutation} onGenerate={() => mutation.mutate()} />
}
