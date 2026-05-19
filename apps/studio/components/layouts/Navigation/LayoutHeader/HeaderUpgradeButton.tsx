import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { useTrack } from '@/lib/telemetry/track'

const EXPERIMENT_FLAG_KEY = 'headerUpgradeCta'
const EXPERIMENT_EXPOSURE_NAME = 'header_upgrade_cta'
type HeaderUpgradeCtaVariant = 'control' | 'test'

interface HeaderUpgradeButtonProps {
  className?: string
}

export const HeaderUpgradeButton = ({ className }: HeaderUpgradeButtonProps) => {
  const track = useTrack()
  const { data: organization } = useSelectedOrganizationQuery()
  const flagValue = usePHFlag<HeaderUpgradeCtaVariant | false>(EXPERIMENT_FLAG_KEY)

  const isFreePlan = organization?.plan?.id === 'free'
  const isInExperiment = flagValue === 'control' || flagValue === 'test'
  const showButton = flagValue === 'test'

  const variant = isFreePlan && isInExperiment ? (flagValue as string) : undefined
  useTrackExperimentExposure(EXPERIMENT_EXPOSURE_NAME, variant)

  if (!isFreePlan) return null
  if (!showButton) return null

  const handleClick = () => {
    track('header_upgrade_cta_clicked')
  }

  return (
    <UpgradePlanButton source={EXPERIMENT_FLAG_KEY} className={className} onClick={handleClick} />
  )
}
