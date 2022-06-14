import dayjs from 'dayjs'
import { FC, FormEvent, useState } from 'react'
import { IconSearch, Input, Listbox, Popover, Button, Modal } from '@supabase/ui'

import { useStore, useFlag } from 'hooks'
import Loading from 'components/ui/Loading'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import ConfirmationModal from 'components/ui/ConfirmationModal'

import BackupsError from '../BackupsError'
import BackupsEmpty from '../BackupsEmpty'
import { ALL_TIMEZONES } from './PITRBackupSelection.constants'
import {
  getClientTimezone,
  getTimezoneOffsetText,
  convertTimeStringtoUnixMs,
} from './PITRBackupSelection.utils'

interface Props {}

const PITRBackupSelection: FC<Props> = () => {
  const { ui, backups } = useStore()
  const isAvailable = useFlag('pitrBackups')

  const [searchString, setSearchString] = useState<string>('')
  const [selectedTimezone, setSelectedTimezone] = useState<any>(getClientTimezone())
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  const [errors, setErrors] = useState<any>()
  const [recoveryPoint, setRecoveryPoint] = useState<string>()

  // Mock new properties, to delete after BE is fully ready
  const { configuration } = backups
  console.log('Configuration', configuration)

  const projectRef = ui.selectedProject?.ref ?? 'default'
  const hasPhysicalBackups =
    configuration.physicalBackupData.earliestPhysicalBackupDateUnix !== null &&
    configuration.physicalBackupData.latestPhysicalBackupDateUnix !== null

  if (backups.isLoading) {
    return <Loading />
  } else if (backups.error) {
    return <BackupsError />
  } else if (!isAvailable) {
    return (
      <div className="flex items-center justify-center rounded border border-gray-500 bg-gray-300 py-8">
        <p className="text-scale-1000 text-sm">Coming soon</p>
      </div>
    )
  } else if (!configuration.walg_enabled) {
    // Using this check as opposed to checking price tier to allow enabling PITR for our own internal projects
    return (
      <UpgradeToPro
        primaryText="Free Plan does not include project backups."
        projectRef={projectRef}
        secondaryText="Please upgrade to Pro plan for access to point in time recovery backups."
      />
    )
  } else if (!hasPhysicalBackups) {
    return <BackupsEmpty />
  }

  const timezoneOptions =
    searchString.length > 0
      ? ALL_TIMEZONES.map((option) => option.text).filter((option) =>
          option.toLowerCase().includes(searchString.toLowerCase())
        )
      : ALL_TIMEZONES.map((option) => option.text)

  const earliestAvailableBackup = dayjs(
    configuration.physicalBackupData.earliestPhysicalBackupDateUnix
  )
    .tz(selectedTimezone.utc[0])
    .format('YYYY-MM-DDTHH:mm:ss')

  const latestAvailableBackup = dayjs(configuration.physicalBackupData.latestPhysicalBackupDateUnix)
    .tz(selectedTimezone.utc[0])
    .format('YYYY-MM-DDTHH:mm:ss')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    if (!recoveryPoint) {
      setErrors({ recoveryPoint: 'Please enter a date to recovery your project from' })
    } else {
      const recoveryTimeTargetUnix = convertTimeStringtoUnixMs(recoveryPoint, selectedTimezone)
      const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
        configuration.physicalBackupData
      const isOutOfRange =
        recoveryTimeTargetUnix < earliestPhysicalBackupDateUnix ||
        recoveryTimeTargetUnix > latestPhysicalBackupDateUnix

      if (isOutOfRange) {
        setErrors({
          recoveryPoint: 'Selected date is out of range for available points of recovery',
        })
      } else {
        setErrors(undefined)
        setShowConfirmation(true)
      }
    }
  }

  const onConfirmRestore = async () => {
    if (!recoveryPoint) return

    // To unix milliseconds
    const recoveryTimeTargetUnix = convertTimeStringtoUnixMs(recoveryPoint, selectedTimezone)
    console.log('Confirm restore', { recoveryTimeTargetUnix, region: configuration.region })
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div className="space-y-4 rounded border border-gray-400 border-opacity-50 bg-gray-300 py-3">
            <div className="flex justify-between px-4">
              <p className="text-scale-1100 flex-1 text-sm">Select timezone</p>
              <div className="flex-1">
                <Listbox
                  value={selectedTimezone.text}
                  onChange={(text) => {
                    const selectedTimezone = ALL_TIMEZONES.find((option) => option.text === text)
                    setSelectedTimezone(selectedTimezone)
                  }}
                  onBlur={() => setSearchString('')}
                >
                  <div
                    className={[
                      'fixed top-0 flex w-full items-center',
                      'rounded-t-md border-b border-gray-600 bg-gray-500',
                      'mb-4 space-x-2 px-4 py-2',
                    ].join(' ')}
                    style={{ zIndex: 1 }}
                  >
                    <IconSearch size={14} />
                    <input
                      autoFocus
                      className="placeholder-scale-1000 w-72 bg-transparent text-sm outline-none"
                      value={searchString}
                      placeholder={''}
                      onChange={(e: FormEvent<HTMLInputElement>) =>
                        setSearchString(e.currentTarget.value)
                      }
                    />
                  </div>
                  {/* Whitespace to shift listbox options down for searchfield */}
                  <div className="h-8" />
                  {timezoneOptions.map((option) => {
                    return (
                      <Listbox.Option key={option} label={option} value={option}>
                        <div>{option}</div>
                      </Listbox.Option>
                    )
                  })}
                  {timezoneOptions.length === 0 && (
                    <Listbox.Option disabled key="no-results" label="" value="">
                      No timezones found
                    </Listbox.Option>
                  )}
                </Listbox>
              </div>
            </div>
            <Popover.Seperator />
            <Input
              readOnly
              disabled
              step={1}
              type="datetime-local"
              className="px-4"
              label="Earliest point of recovery"
              layout="horizontal"
              value={earliestAvailableBackup}
            />
            <Input
              readOnly
              disabled
              step={1}
              type="datetime-local"
              className="px-4"
              label="Latest point of recovery"
              layout="horizontal"
              value={latestAvailableBackup}
            />
            <Input
              step={1}
              type="datetime-local"
              error={errors?.recoveryPoint}
              className="px-4"
              label="Recovery point"
              layout="horizontal"
              onChange={(e) => {
                setErrors(undefined)
                setRecoveryPoint(e.target.value)
              }}
            />
            <Popover.Seperator />
            <div className="flex items-center justify-end px-4">
              <Button type="default">Restore</Button>
            </div>
          </div>
        </div>
      </form>
      <ConfirmationModal
        visible={showConfirmation}
        size="medium"
        header="Confirm to restore"
        children={
          <Modal.Content>
            <div className="space-y-2 py-4">
              <div className="space-y-1">
                <p className="text-scale-1100 text-sm">
                  Are you sure you want to restore your database from:
                </p>
                <p className="text-scale-1200 text-sm">
                  {dayjs(recoveryPoint).format('DD MMM YYYY, HH:mm:ss')} (
                  {getTimezoneOffsetText(selectedTimezone)})?
                </p>
              </div>
              <p className="text-scale-1100 text-sm">
                This will destroy any new data written since this backup was made.
              </p>
            </div>
          </Modal.Content>
        }
        buttonLabel="Restore"
        buttonLoadingLabel="Restoring"
        onSelectCancel={() => setShowConfirmation(false)}
        onSelectConfirm={onConfirmRestore}
      />
    </>
  )
}

export default PITRBackupSelection
