import { StateDot } from '../StateDot'
import { SlotWalStatus } from './ReplicationPipelineStatus.types'
import { getWalStatusMeta } from './ReplicationPipelineStatus.utils'

export const SLOT_STATUS_TOOLTIP =
  'How safely your database is keeping the changes this pipeline’s main replication slot still needs'

/** How safely Postgres is keeping the changes the slot still needs. */
export const SlotWalStatusValue = ({ status }: { status?: SlotWalStatus }) => {
  const meta = getWalStatusMeta(status)
  return <StateDot variant={meta.variant}>{meta.label}</StateDot>
}
