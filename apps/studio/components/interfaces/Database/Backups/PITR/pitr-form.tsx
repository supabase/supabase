import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import DatePicker from 'react-datepicker'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { format } from 'date-fns'
import InformationBox from 'components/ui/InformationBox'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import {
  constrainDateToRange,
  formatNumberToTwoDigits,
  getClientTimezone,
  getDatesBetweenRange,
} from './PITR.utils'
import { TimezoneSelection } from './TimezoneSelection'
import TimeInput from './TimeInput'
import { Timezone } from './PITR.types'
import { useMemo, useState } from 'react'

type Props = {
  onSubmit: (data: {
    recoveryTimeTargetUnix: number
    recoveryTimeString: string
    recoveryTimeStringUtc: string
  }) => void
  earliestAvailableBackupUnix: number
  latestAvailableBackupUnix: number
}

export function PITRForm({
  onSubmit,
  earliestAvailableBackupUnix,
  latestAvailableBackupUnix,
}: Props) {
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getClientTimezone())
  const earliestAvailableBackup = dayjs
    .unix(earliestAvailableBackupUnix ?? 0)
    .tz(selectedTimezone.utc[0])
  const latestAvailableBackup = dayjs
    .unix(latestAvailableBackupUnix ?? 0)
    .tz(selectedTimezone.utc[0])

  const [selectedDateRaw, setSelectedDateRaw] = useState<Date>(latestAvailableBackup.toDate())

  const selectedDate = dayjs(selectedDateRaw).tz(selectedTimezone.utc[0], true)
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

  const recoveryTimeTargetUnix = selectedDate.unix()
  const recoveryTimeString = selectedDate.format('DD MMM YYYY HH:mm:ss')
  const recoveryTimeStringUtc = selectedDate.utc().format('DD MMM YYYY HH:mm:ss')

  const isWithinRange = useMemo(
    () =>
      (!!selectedDate && selectedDate.isSame(latestAvailableBackup)) ||
      selectedDate.isSame(earliestAvailableBackup) ||
      (selectedDate.isBefore(latestAvailableBackup) &&
        selectedDate.isAfter(earliestAvailableBackup)),
    [selectedDate, latestAvailableBackup, earliestAvailableBackup]
  )

  const onUpdateDate = (date: Date) => {
    setSelectedDateRaw(
      constrainDateToRange(
        dayjs(date).tz(selectedTimezone.utc[0], true),
        earliestAvailableBackup,
        latestAvailableBackup
      ).toDate()
    )
  }

  const handleSubmit = () => {
    onSubmit({
      recoveryTimeTargetUnix,
      recoveryTimeString,
      recoveryTimeStringUtc,
    })
  }

  return (
    <div>
      <FormPanel
        disabled={true}
        footer={
          <div className="flex items-center justify-end gap-3 p-6">
            <ButtonTooltip
              type="default"
              disabled={!selectedDate || !isWithinRange}
              onClick={handleSubmit}
              tooltip={{
                content: {
                  hidden: !isWithinRange,
                  side: 'bottom',
                  text: !isWithinRange
                    ? 'Selected date is out of range where backups are available'
                    : undefined,
                },
              }}
            >
              Continue
            </ButtonTooltip>
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
                      <ChevronLeft size={16} strokeWidth={2} />
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
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            />
            {availableDates.length > 1 && (
              <div className="flex items-center space-x-2">
                <div className="border w-4 h-4 border-stronger bg-overlay-hover" />
                <p className="text-xs text-foreground-light">Point in time back up available</p>
              </div>
            )}
          </div>

          <div className="w-2/3">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center">
                <div className="mx-2">
                  <InformationBox
                    defaultVisibility
                    hideCollapse
                    icon={<HelpCircle size={14} strokeWidth={2} />}
                    title="Select a date which you'd like to restore your database to"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-2">
                <div className="space-y-1">
                  <p className="text-sm text-foreground-light">Date to restore to</p>
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
                        maximumTime={isSelectedOnLatestDay ? latestAvailableBackupTime : undefined}
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
                      Enter a time within the available range to restore from. <br /> Backups are
                      captured every 2 minutes, allowing you to enter a time and restore your
                      database to the closest backup point. We'll match the time you enter to the
                      closest backup within the 2-minute window
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
    </div>
  )
}
