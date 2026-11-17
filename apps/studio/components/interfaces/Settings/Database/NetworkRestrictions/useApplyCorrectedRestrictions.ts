import { getCorrectedRestrictions } from './NetworkRestrictions.utils'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

interface UseApplyCorrectedRestrictionsParams {
  projectRef: string
  ipv4: string[]
  ipv6: string[]
  onSuccess: () => void
}

// Saves the lists with each entry that isn't a valid range replaced by its suggestion, or dropped when it has none.
// onSuccess is set on the mutation rather than per call, so it still runs when the refetch unmounts the caller first.
export const useApplyCorrectedRestrictions = ({
  projectRef,
  ipv4,
  ipv6,
  onSuccess,
}: UseApplyCorrectedRestrictionsParams) => {
  const { mutate, isPending } = useNetworkRestrictionsApplyMutation({ onSuccess })

  const corrected = getCorrectedRestrictions({ ipv4, ipv6 })
  const hasCorrectedEntries =
    corrected.dbAllowedCidrs.length > 0 || corrected.dbAllowedCidrsV6.length > 0

  const applyCorrected = () =>
    mutate({
      projectRef,
      dbAllowedCidrs: corrected.dbAllowedCidrs,
      dbAllowedCidrsV6: corrected.dbAllowedCidrsV6,
    })

  return { corrected, hasCorrectedEntries, applyCorrected, isApplyingCorrected: isPending }
}
