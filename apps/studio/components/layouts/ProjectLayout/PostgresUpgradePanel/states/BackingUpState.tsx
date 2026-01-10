import { ActiveUpgradeView } from '../ActiveUpgradeView'
import { BackingUpStateProps } from '../types'

export const BackingUpState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  initiatedAt,
}: BackingUpStateProps) => {
  return <ActiveUpgradeView variant="backingUp" initiatedAt={initiatedAt} />
}
