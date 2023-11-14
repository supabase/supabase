import * as Tooltip from '@radix-ui/react-tooltip'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { Alert, Button, IconChevronLeft, IconChevronRight, IconHelpCircle, Modal } from 'ui'

import { FormHeader, FormPanel } from 'components/ui/Forms'
import InformationBox from 'components/ui/InformationBox'
import { useBackupsQuery } from 'data/database/backups-query'
import { usePitrRestoreMutation } from 'data/database/pitr-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { PROJECT_STATUS } from 'lib/constants'
import BackupsEmpty from '../BackupsEmpty'
import { Timezone } from './PITR.types'
import {
  constrainDateToRange,
  formatNumberToTwoDigits,
  getClientTimezone,
  getDatesBetweenRange,
} from './PITR.utils'
import PITRStatus from './PITRStatus'
import TimeInput from './TimeInput'
import TimezoneSelection from './TimezoneSelection'

const PITRSelection = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const { data: backups } = useBackupsQuery({ projectRef: ref })
  const [showConfiguration, setShowConfiguration] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getClientTimezone())

  const {
    mutate: restoreFromPitr,
    isLoading: isRestoring,
    isSuccess: isSuccessPITR,
  } = usePitrRestoreMutation({
    onSuccess: (res, variables) => {
      setTimeout(() => {
        setShowConfirmation(false)
        setProjectStatus(queryClient, variables.ref, PROJECT_STATUS.RESTORING)
        router.push(`/project/${variables.ref}`)
      }, 3000)
    },
  })

  const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
    backups?.physicalBackupData ?? {}
  const hasNoBackupsAvailable = !earliestPhysicalBackupDateUnix || !latestPhysicalBackupDateUnix
  const earliestAvailableBackup = dayjs
    .unix(earliestPhysicalBackupDateUnix ?? 0)
    .tz(selectedTimezone.utc[0])
  const latestAvailableBackup = dayjs
    .unix(latestPhysicalBackupDateUnix ?? 0)
    .tz(selectedTimezone.utc[0])

  const [selectedDateRaw, setSelectedDateRaw] = useState<Date>(latestAvailableBackup.toDate())
  const selectedDate = dayjs(selectedDateRaw).tz(selectedTimezone.utc[0], true) // true to keep local time and just change +whatever

  const isSelectedOnEarliestDay = selectedDate.isSame(earliestAvailableBackup, 'day')
  const isSelectedOnLatestDay = selectedDate.isSame(latestAvailableBackup, 'day')
  const availableDates = getDatesBetweenRange(earliestAvailableBackup, latestAvailableBackup)

  const selectedTime = {
    h: selectedDate.hour(),
    m: selectedDate.minute(),
    s: selectedDate.second(),
  }

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
  const recoveryTimeTargetUnix = selectedDate.unix()
  // Formatting from the unix again just to double check correctness
  const recoveryTimeString = selectedDate.format('DD MMM YYYY HH:mm:ss')
  const recoveryTimeStringUtc = selectedDate.utc().format('DD MMM YYYY HH:mm:ss')

  const isSelectedOutOfRange =
    selectedDate &&
    (selectedDate.isBefore(earliestAvailableBackup) || selectedDate.isAfter(latestAvailableBackup))

  const onUpdateDate = (date: Date) => {
    setSelectedDateRaw(
      constrainDateToRange(
        dayjs(date).tz(selectedTimezone.utc[0], true),
        earliestAvailableBackup,
        latestAvailableBackup
      ).toDate()
    )
  }

  const onCancel = () => {
    setShowConfiguration(false)
    setSelectedTimezone(getClientTimezone())
  }

  const onConfirmRestore = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!recoveryTimeTargetUnix) return console.error('Recovery time target unix is required')
    restoreFromPitr({ ref, recovery_time_target_unix: recoveryTimeTargetUnix })
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
                    <Tooltip.Trigger asChild>
                      <Button
                        type="warning"
                        disabled={isSelectedOutOfRange || !selectedDate}
                        onClick={() => setShowConfirmation(true)}
                      >
                        Review restore details
                      </Button>
                    </Tooltip.Trigger>
                    {isSelectedOutOfRange && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'bg-alternative rounded py-1 px-2 leading-none shadow',
                              'border-background border w-48 text-center',
                            ].join(' ')}
                          >
                            <span className="text-foreground text-xs">
                              Selected date is out of range where backups are available
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                </div>
              }
            >
              <div className="flex justify-between px-10 py-6 space-x-10">
                <div className="w-1/3 space-y-2">
                  <DatePicker
                    inline
                    selected={selectedDateRaw}
                    onChange={onUpdateDate}
                    dayClassName={() => 'cursor-pointer'}
                    minDate={earliestAvailableBackup.toDate()}
                    maxDate={latestAvailableBackup.toDate()}
                    highlightDates={availableDates.map((date) => date.toDate())}
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
                            text-foreground-light hover:text-foreground focus:outline-none
                        `}
                          >
                            <IconChevronLeft size={16} strokeWidth={2} />
                          </button>
                          <span className="text-foreground-light text-sm">
                            {format(date, 'MMMM yyyy')}
                          </span>
                          <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            type="button"
                            className={`
                            ${nextMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                            text-foreground-light hover:text-foreground focus:outline-none
                        `}
                          >
                            <IconChevronRight size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  />
                  <div className="flex items-center space-x-2">
                    <div className="border w-4 h-4 border-stronger bg-overlay-hover" />
                    <p className="text-xs text-foreground-light">Point in time back up available</p>
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
                        <p className="text-sm text-foreground-light">Restore database to</p>
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
                          <p className="text-sm text-foreground-light">Time zone</p>
                          <div className="w-[350px]">
                            <TimezoneSelection
                              hideLabel
                              dropdownWidth="w-[400px]"
                              selectedTimezone={selectedTimezone}
                              onSelectTimezone={setSelectedTimezone}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="space-y-1">
                            <p className="text-sm text-foreground-light">Recovery time</p>
                            <TimeInput
                              defaultTime={selectedTime}
                              minimumTime={
                                isSelectedOnEarliestDay ? earliestAvailableBackupTime : undefined
                              }
                              maximumTime={
                                isSelectedOnLatestDay ? latestAvailableBackupTime : undefined
                              }
                              onChange={({ h, m, s }) => {
                                const newDate = dayjs(selectedDateRaw)
                                  .set('hour', h)
                                  .set('minute', m)
                                  .set('second', s)

                                setSelectedDateRaw(newDate.toDate())
                              }}
                            />
                          </div>

                          <p className="text-sm text-foreground-light mt-8">
                            Enter a time within the available range to restore from. <br /> Backups
                            are captured every 2 minutes, allowing you to enter a time and restore
                            your database to the closest backup point. We'll match the time you
                            enter to the closest backup within the 2-minute window
                          </p>
                        </div>
                        <div className="!mt-4 space-y-1">
                          <h3 className="text-sm text-foreground-light"></h3>
                          {isSelectedOnEarliestDay && (
                            <p className="text-sm text-foreground-light">
                              <strong>Earliest backup available for this date</strong>:{' '}
                              {earliestAvailableBackup.format('HH:mm:ss')}
                            </p>
                          )}
                          {isSelectedOnLatestDay && (
                            <p className="text-sm text-foreground-light">
                              <strong>Latest backup available for this date</strong>:{' '}
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
        header="Point in time recovery review"
        customFooter={
          <div className="flex items-center justify-end space-x-2">
            <Button
              type="default"
              disabled={isRestoring || isSuccessPITR}
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              type="warning"
              disabled={isRestoring || isSuccessPITR}
              loading={isRestoring || isSuccessPITR}
              onClick={onConfirmRestore}
            >
              I understand, begin restore
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-3">
          <Modal.Content>
            <div className="py-2 space-y-1">
              <p className="text-sm text-foreground-light">Your database will be restored to:</p>
            </div>
            <div className="py-2 flex flex-col gap-3">
              <div>
                <p className="text-sm font-mono text-foreground-lighter">
                  {selectedTimezone?.text}
                </p>
                <p className="text-2xl">{recoveryTimeString}</p>
              </div>
              <div>
                <p className="text-sm font-mono text-foreground-lighter">(UTC+00:00)</p>
                <p className="text-2xl">{recoveryTimeStringUtc}</p>
              </div>
            </div>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <Alert
              withIcon
              variant="warning"
              title="This action cannot be undone, not cancelled once started"
            >
              Any changes made to your database after this point in time will be lost. This includes
              any changes to your project's storage and authentication.
            </Alert>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <p className="text-sm text-foreground-light">
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
