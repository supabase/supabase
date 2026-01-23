import { ActiveUpgradeView } from '../ActiveUpgradeView'
import { UpgradingStateProps } from '../types'

export const UpgradingState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  progress,
  initiatedAt,
}: UpgradingStateProps) => {
  return <ActiveUpgradeView variant="upgrading" progress={progress} initiatedAt={initiatedAt} />
}
