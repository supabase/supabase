import dayjs from 'dayjs'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import { Button, Modal, IconChevronLeft, IconChevronRight, IconHelpCircle, Alert } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import InformationBox from 'components/ui/InformationBox'
import TimeInput from './TimeInput'
import TimezoneSelection from './TimezoneSelection'
import { Time, Timezone } from './PITR.types'
import PITRStatus from './PITRStatus'
import {
  checkMatchingDates,
  convertDatetimetoUnixS,
  formatNumberToTwoDigits,
  formatTimeToTimeString,
  getClientTimezone,
  getDatesBetweenRange,
} from './PITR.utils'
import { useRouter } from 'next/router'
import BackupsEmpty from '../BackupsEmpty'

const DEFAULT_TIME = { h: 0, m: 0, s: 0 }

const PITRSelection = ({}) => {
  const router = useRouter()
  const { ref } = router.query

  const { app, ui, backups } = useStore()
  const projectId = ui.selectedProject?.id ?? -1

  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<Time>({ h: 0, m: 0, s: 0 })
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getClientTimezone())

  const [showConfiguration, setShowConfiguration] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      if (selectedDate < earliestAvailableBackupFormatted) {
        setSelectedDate(earliestAvailableBackupFormatted)
      } else if (selectedDate > latestAvailableBackupFormatted) {
        setSelectedDate(latestAvailableBackupFormatted)
      }
    }
  }, [selectedTimezone])

  useEffect(() => {
    const formattedSelectedTime = dayjs(formatTimeToTimeString(selectedTime), 'HH:mm:ss', true)
    const formattedEarliestTime = dayjs(
      formatTimeToTimeString(earliestAvailableBackupTime),
      'HH:mm:ss',
      true
    )
    const formattedLatestTime = dayjs(
      formatTimeToTimeString(latestAvailableBackupTime),
      'HH:mm:ss',
      true
    )

    if (isSelectedOnEarliest && formattedSelectedTime.isBefore(formattedEarliestTime)) {
      return setSelectedTime(earliestAvailableBackupTime)
    }

    if (isSelectedOnLatest && formattedSelectedTime.isAfter(formattedLatestTime)) {
      return setSelectedTime(latestAvailableBackupTime)
    }
  }, [selectedDate, selectedTimezone])

  const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
    backups?.configuration?.physicalBackupData ?? {}
  const hasNoBackupsAvailable = !earliestPhysicalBackupDateUnix || !latestPhysicalBackupDateUnix
  const earliestAvailableBackup = dayjs(earliestPhysicalBackupDateUnix * 1000).tz(
    selectedTimezone?.utc[0]
  )
  const latestAvailableBackup = dayjs(latestPhysicalBackupDateUnix * 1000).tz(
    selectedTimezone?.utc[0]
  )

  // Start: Variables specifically for date picker component
  // Required as it only works with vanilla Date object which is not timezone localized
  const earliestAvailableBackupFormatted = new Date(earliestAvailableBackup.format('YYYY-MM-DD'))
  const latestAvailableBackupFormatted = new Date(latestAvailableBackup.format('YYYY-MM-DD'))
  const isSelectedOnEarliest = checkMatchingDates(selectedDate, earliestAvailableBackupFormatted)
  const isSelectedOnLatest = checkMatchingDates(selectedDate, latestAvailableBackupFormatted)
  const availableDates = getDatesBetweenRange(
    earliestAvailableBackupFormatted,
    latestAvailableBackupFormatted
  )
  // End: Variables specifically for date picker component

  const earliestAvailableBackupTime = {
    h: earliestAvailableBackup.hour(),
    m: earliestAvailableBackup.minute(),
    s: earliestAvailableBackup.second(),
  }

  const latestAvailableBackupTime = {
    h: latestAvailableBackup.hour(),
    m: latestAvailableBackup.minute(),
    s: latestAvailableBackup.second(),
  }

  // This will be the actual unix timestamp for the backup
  const recoveryTimeTargetUnix = selectedDate
    ? convertDatetimetoUnixS(selectedDate, selectedTime, selectedTimezone)
    : 0
  // Formatting from the unix again just to double check correctness
  const recoveryTimeString = dayjs(recoveryTimeTargetUnix * 1000)
    .tz(selectedTimezone?.utc[0])
    .format('DD MMM YYYY HH:mm:ss')

  const isSelectedOutOfRange =
    selectedDate &&
    (recoveryTimeTargetUnix < earliestPhysicalBackupDateUnix ||
      recoveryTimeTargetUnix > latestPhysicalBackupDateUnix)

  const onUpdateDate = (date: Date) => setSelectedDate(date)

  const onCancel = () => {
    setShowConfiguration(false)
    setSelectedDate(undefined)
    setSelectedTime(DEFAULT_TIME)
    setSelectedTimezone(getClientTimezone())
  }

  const onConfirmRestore = async () => {
    if (!recoveryTimeTargetUnix) return

    setIsRestoring(true)
    const projectRef = ref as string
    const { error } = await post(`${API_URL}/database/${projectRef}/backups/pitr`, {
      recovery_time_target_unix: recoveryTimeTargetUnix,
    })

    if (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to start restoration: ${error.message}`,
      })
      setIsRestoring(false)
    } else {
      setTimeout(() => {
        setShowConfirmation(false)
        app.onProjectStatusUpdated(projectId, PROJECT_STATUS.RESTORING)
        router.push(`/project/${projectRef}`)
      }, 3000)
    }
  }

  return (
    <>
      <FormHeader
        title="Restore your database from a backup"
        description="Database changes are watched and recorded, so that you can restore your database to any point in time"
      />
      {hasNoBackupsAvailable ? (
        <BackupsEmpty />
      ) : (
        <>
          {!showConfiguration ? (
            <PITRStatus
              selectedTimezone={selectedTimezone}
              onUpdateTimezone={setSelectedTimezone}
              onSetConfiguration={() => setShowConfiguration(true)}
            />
          ) : (
            <FormPanel
              disabled={true}
              footer={
                <div className="flex items-center justify-end gap-3 p-6">
                  <Button type="default" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <Button
                        as="span"
                        type="warning"
                        disabled={isSelectedOutOfRange || !selectedDate}
                        onClick={() => setShowConfirmation(true)}
                      >
                        Review restore details
                      </Button>
                    </Tooltip.Trigger>
                    {isSelectedOutOfRange && (
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                            'border-scale-200 border w-48 text-center',
                          ].join(' ')}
                        >
                          <span className="text-scale-1200 text-xs">
                            Selected date is out of range where backups are available
                          </span>
                        </div>
                      </Tooltip.Content>
                    )}
                  </Tooltip.Root>
                </div>
              }
            >
              <div className="flex justify-between px-10 py-6 space-x-10">
                <div className="w-1/3 space-y-2">
                  <DatePicker
                    inline
                    selected={selectedDate}
                    onChange={onUpdateDate}
                    dayClassName={() => 'cursor-pointer'}
                    minDate={earliestAvailableBackupFormatted}
                    maxDate={latestAvailableBackupFormatted}
                    highlightDates={availableDates}
                    renderCustomHeader={({
                      date,
                      decreaseMonth,
                      increaseMonth,
                      prevMonthButtonDisabled,
                      nextMonthButtonDisabled,
                    }) => (
                      <div className="flex items-center justify-between px-2 py-2">
                        <div className="flex w-full items-center justify-between">
                          <button
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            type="button"
                            className={`
                            ${prevMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                            text-scale-1100 hover:text-scale-1200 focus:outline-none
                        `}
                          >
                            <IconChevronLeft size={16} strokeWidth={2} />
                          </button>
                          <span className="text-scale-1100 text-sm">
                            {format(date, 'MMMM yyyy')}
                          </span>
                          <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            type="button"
                            className={`
                            ${nextMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                            text-scale-1100 hover:text-scale-1200 focus:outline-none
                        `}
                          >
                            <IconChevronRight size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  />
                  <div className="flex items-center space-x-2">
                    <div className="border w-4 h-4 border-scale-800 bg-brand-600" />
                    <p className="text-xs text-scale-1000">Point in time back up available</p>
                  </div>
                </div>

                <div className="w-2/3">
                  {!selectedDate ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="mx-2">
                        <InformationBox
                          defaultVisibility
                          hideCollapse
                          icon={<IconHelpCircle strokeWidth={2} />}
                          title="Select a date which you'd like to restore your database to"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 py-2">
                      <div className="space-y-1">
                        <p className="text-sm text-scale-1100">Restore database to</p>
                        <p className="text-3xl">
                          <span>{dayjs(selectedDate).format('DD MMM YYYY')}</span>
                          <span>
                            , {formatNumberToTwoDigits(selectedTime.h)}:
                            {formatNumberToTwoDigits(selectedTime.m)}:
                            {formatNumberToTwoDigits(selectedTime.s)}
                          </span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm text-scale-1100">Time zone</p>
                          <div className="w-[350px]">
                            <TimezoneSelection
                              hideLabel
                              dropdownWidth="w-[400px]"
                              selectedTimezone={selectedTimezone}
                              onSelectTimezone={setSelectedTimezone}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-scale-1100">Time of recovery</p>
                          <TimeInput
                            defaultTime={selectedTime}
                            minimumTime={
                              isSelectedOnEarliest ? earliestAvailableBackupTime : undefined
                            }
                            maximumTime={isSelectedOnLatest ? latestAvailableBackupTime : undefined}
                            onChange={setSelectedTime}
                          />
                        </div>
                        <div className="!mt-4 space-y-1">
                          {isSelectedOnEarliest && (
                            <p className="text-sm text-scale-1000">
                              Earliest available backup on this date is at{' '}
                              {earliestAvailableBackup.format('HH:mm:ss')}
                            </p>
                          )}
                          {isSelectedOnLatest && (
                            <p className="text-sm text-scale-1000">
                              Latest available backup on this date is at{' '}
                              {latestAvailableBackup.format('HH:mm:ss')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FormPanel>
          )}
        </>
      )}
      <Modal
        closable
        size="medium"
        visible={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        customFooter={
          <div className="flex items-center justify-end space-x-2">
            <Button
              type="default"
              disabled={isRestoring}
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              type="warning"
              disabled={isRestoring}
              loading={isRestoring}
              onClick={onConfirmRestore}
            >
              I understand, begin restore
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-3">
          <Modal.Content>
            <p>Point in time recovery review</p>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <div className="py-2 space-y-1">
              <p className="text-sm text-scale-1100"> Your database will be restored to</p>
              <p className="text-2xl">{recoveryTimeString}</p>
              <p className="text-lg">{selectedTimezone?.text}</p>
            </div>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <Alert
              withIcon
              variant="warning"
              title="This action cannot be undone, not cancelled once started"
            >
              <div className="space-y-3">
                <p>
                  Any changes made to your database after this point in time will be lost. This
                  includes any changes to your project's storage and authentication.
                </p>
              </div>
            </Alert>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <p className="text-sm">
              Restores may take from a few minutes up to several hours depending on the size of your
              database. During this period, your project will not be available, until the
              restoration is completed.
            </p>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default PITRSelection
