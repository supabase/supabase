import dayjs from 'dayjs'
import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconAlertCircle } from 'ui'

import { useStore } from 'hooks'
import { Timezone } from './PITR.types'
import { FormPanel } from 'components/ui/Forms'
import TimezoneSelection from './TimezoneSelection'

interface Props {
  selectedTimezone: Timezone
  onUpdateTimezone: (timezone: Timezone) => void
  onSetConfiguration: () => void
}

const PITRStatus: FC<Props> = ({ selectedTimezone, onUpdateTimezone, onSetConfiguration }) => {
  const { backups } = useStore()
  const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
    backups?.configuration?.physicalBackupData ?? {}

  const earliestAvailableBackup = dayjs
    .unix(earliestPhysicalBackupDateUnix)
    .tz(selectedTimezone?.utc[0])
    .format('DD MMM YYYY, HH:mm:ss')

  const latestAvailableBackup = dayjs
    .unix(latestPhysicalBackupDateUnix)
    .tz(selectedTimezone?.utc[0])
    .format('DD MMM YYYY, HH:mm:ss')

  return (
    <>
      <FormPanel
        disabled={true}
        footer={
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <IconAlertCircle className="text-scale-1100" size={18} strokeWidth={1.5} />
              <span className="text-scale-1000 text-sm">
                You'll be able to pick the right date and time when you begin
              </span>
            </div>
            <Button onClick={() => onSetConfiguration()}>Start a restore</Button>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <div className="w-[350px]">
            <TimezoneSelection
              hideLabel
              selectedTimezone={selectedTimezone}
              onSelectTimezone={onUpdateTimezone}
            />
          </div>
          <div className="flex items-center space-x-20">
            <div className="space-y-2">
              <p className="text-sm text-scale-1100">Database restore available from</p>
              <p className="text-2xl">{earliestAvailableBackup}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-scale-1100">Latest restore available at</p>
              <p className="text-2xl">{latestAvailableBackup}</p>
            </div>
          </div>
        </div>
      </FormPanel>
    </>
  )
}

export default observer(PITRStatus)
