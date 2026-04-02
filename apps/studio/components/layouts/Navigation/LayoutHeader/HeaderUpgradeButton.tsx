import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

const EXPERIMENT_ID = 'headerUpgradeCta'
type HeaderUpgradeCtaVariant = 'control' | 'test'

interface HeaderUpgradeButtonProps {
  className?: string
}

export const HeaderUpgradeButton = ({ className }: HeaderUpgradeButtonProps) => {
  const track = useTrack()
  const { data: organization } = useSelectedOrganizationQuery()
  const flagValue = usePHFlag<HeaderUpgradeCtaVariant | false>(EXPERIMENT_ID)

  const isFreePlan = organization?.plan?.id === 'free'
  const isInExperiment = flagValue === 'control' || flagValue === 'test'
  const showButton = flagValue === 'test'

  // Track experiment exposure for all free-plan users in the experiment (both control and test)
  const variant = isFreePlan && isInExperiment ? (flagValue as string) : undefined
  useTrackExperimentExposure(EXPERIMENT_ID, variant)

  if (!IS_PLATFORM) return null
  if (!isFreePlan) return null
  if (!showButton) return null

  const handleClick = () => {
    track('header_upgrade_cta_clicked', { currentPlan: organization?.plan?.id ?? 'free' })
  }

  return (
    <div onClick={handleClick} className={className}>
      <UpgradePlanButton source={EXPERIMENT_ID} />
    </div>
  )
}
