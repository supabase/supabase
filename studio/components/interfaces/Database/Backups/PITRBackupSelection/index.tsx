import dayjs from 'dayjs'
import Link from 'next/link'
import { FC, FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import { IconSearch, IconInfo, Input, Listbox, Popover, Button, Modal } from '@supabase/ui'

import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
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
  convertTimeStringtoUnixS,
} from './PITRBackupSelection.utils'

interface Props {}

const PITRBackupSelection: FC<Props> = () => {
  const router = useRouter()
  const { app, ui, backups } = useStore()
  const isAvailable = useFlag('pitrBackups')

  const projectId = ui.selectedProject?.id ?? -1
  const projectRef = ui.selectedProject?.ref ?? 'default'

  if (!isAvailable) {
    return (
      <div className="block w-full rounded border border-gray-400 border-opacity-50 bg-gray-300 p-3">
        <div className="flex space-x-3">
          <IconInfo size={20} strokeWidth={1.5} />
          <p className="text-scale-1100 text-sm">
            Coming soon - Point in time backups is an Enterprise feature. Reach out to us{' '}
            <Link href={`/support/new?ref=${projectRef}&category=sales`}>
              <a className="text-brand-900">here</a>
            </Link>{' '}
            if you're interested!
          </p>
        </div>
      </div>
    )
  }

  const [searchString, setSearchString] = useState<string>('')
  const [selectedTimezone, setSelectedTimezone] = useState<any>(getClientTimezone())
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  const [errors, setErrors] = useState<any>()
  const [recoveryPoint, setRecoveryPoint] = useState<string>()

  const { configuration } = backups

  if (backups.isLoading) {
    return <Loading />
  } else if (backups.error) {
    return <BackupsError />
  }

  const hasPhysicalBackups =
    configuration.physicalBackupData.earliestPhysicalBackupDateUnix !== null &&
    configuration.physicalBackupData.latestPhysicalBackupDateUnix !== null &&
    configuration.physicalBackupData.earliestPhysicalBackupDateUnix !==
      configuration.physicalBackupData.latestPhysicalBackupDateUnix

  if (!configuration.walg_enabled) {
    return (
      <div className="block w-full rounded border border-gray-400 border-opacity-50 bg-gray-300 p-3">
        <div className="flex space-x-3">
          <IconInfo size={20} strokeWidth={1.5} />
          <p className="text-sm">
            Point in time backups is an Enterprise feature. Reach out to us{' '}
            <Link href={`/support/new?ref=${projectRef}&category=sales`}>
              <a className="text-brand-900">here</a>
            </Link>{' '}
            if you're interested!
          </p>
        </div>
      </div>
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

  const earliestAvailableBackup = dayjs
    .unix(configuration.physicalBackupData.earliestPhysicalBackupDateUnix)
    .tz(selectedTimezone.utc[0])
    .format('YYYY-MM-DDTHH:mm:ss')

  const latestAvailableBackup = dayjs
    .unix(configuration.physicalBackupData.latestPhysicalBackupDateUnix)
    .tz(selectedTimezone.utc[0])
    .format('YYYY-MM-DDTHH:mm:ss')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    if (!recoveryPoint) {
      setErrors({ recoveryPoint: 'Please enter a date to recover your project from' })
    } else {
      const recoveryTimeTargetUnix = convertTimeStringtoUnixS(recoveryPoint, selectedTimezone)
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

    const recoveryTimeTargetUnix = convertTimeStringtoUnixS(recoveryPoint, selectedTimezone)
    const { error } = await post(`${API_URL}/database/${projectRef}/backups/pitr`, {
      recovery_time_target_unix: recoveryTimeTargetUnix,
    })

    if (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Point in time recovery for project failed`,
      })
      setShowConfirmation(false)
    } else {
      setTimeout(() => {
        setShowConfirmation(false)
        app.onProjectStatusUpdated(projectId, PROJECT_STATUS.RESTORING)
        ui.setNotification({
          category: 'success',
          message: `Restoring database back to ${dayjs(recoveryPoint).format(
            'DD MMM YYYY, HH:mm:ss'
          )} (
                ${getTimezoneOffsetText(selectedTimezone)})`,
        })
        router.push(`/project/${projectRef}`)
      }, 3000)
    }
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div className="space-y-4 rounded border border-gray-400 border-opacity-50 bg-gray-300 py-3">
            <div className="space-y-4 py-2">
              <div className="flex justify-between space-x-8">
                <p className="w-2/5 pl-4 text-sm">Select timezone</p>
                <div className="w-3/5 px-4">
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
              <div className="flex justify-between space-x-8">
                <div className="w-2/5 space-y-2 pl-4">
                  <p className="text-sm">Earliest point of recovery</p>
                </div>
                <div className="w-3/5">
                  <Input
                    readOnly
                    disabled
                    step={1}
                    type="datetime-local"
                    className="px-4"
                    value={earliestAvailableBackup}
                  />
                </div>
              </div>
              <div className="flex justify-between space-x-8">
                <div className="w-2/5 space-y-2 pl-4">
                  <p className="text-sm">Latest point of recovery</p>
                </div>
                <div className="w-3/5">
                  <Input
                    readOnly
                    disabled
                    step={1}
                    type="datetime-local"
                    className="px-4"
                    value={latestAvailableBackup}
                  />
                </div>
              </div>
            </div>
            <Popover.Seperator />
            <div className="flex justify-between space-x-8 py-2">
              <div className="w-2/5 space-y-2 pl-4">
                <p className="text-sm">Recovery point</p>
                <p className="text-scale-1100 text-sm">
                  Select a date and time that you would like to restore your project to
                </p>
              </div>
              <div className="w-3/5">
                <Input
                  step={1}
                  type="datetime-local"
                  error={errors?.recoveryPoint}
                  className="px-4"
                  onChange={(e) => {
                    setErrors(undefined)
                    setRecoveryPoint(e.target.value)
                  }}
                />
              </div>
            </div>
            <Popover.Seperator />
            <div className="flex items-center justify-end px-4">
              <Button type="default" htmlType="submit">
                Restore
              </Button>
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
