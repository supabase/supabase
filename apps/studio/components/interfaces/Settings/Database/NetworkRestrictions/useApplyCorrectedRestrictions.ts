import { getCorrectedRestrictions } from './NetworkRestrictions.utils'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

interface UseApplyCorrectedRestrictionsParams {
  projectRef: string
  ipv4: string[]
  ipv6: string[]
}

// Saves the lists with each entry that isn't a valid range replaced by its suggestion, or dropped when it has none
export const useApplyCorrectedRestrictions = ({
  projectRef,
  ipv4,
  ipv6,
}: UseApplyCorrectedRestrictionsParams) => {
  const { mutate, isPending } = useNetworkRestrictionsApplyMutation()

  const corrected = getCorrectedRestrictions({ ipv4, ipv6 })
  const hasCorrectedEntries =
    corrected.dbAllowedCidrs.length > 0 || corrected.dbAllowedCidrsV6.length > 0

  const applyCorrected = (onSuccess: () => void) =>
    mutate(
      {
        projectRef,
        dbAllowedCidrs: corrected.dbAllowedCidrs,
        dbAllowedCidrsV6: corrected.dbAllowedCidrsV6,
      },
      { onSuccess }
    )

  return { corrected, hasCorrectedEntries, applyCorrected, isApplyingCorrected: isPending }
}
