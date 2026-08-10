import dayjs from 'dayjs'
import { useState } from 'react'
import { Calendar, cn } from 'ui'

import { getDatesBetweenRange, toCalendarDate, withCalendarDate, withTime } from './PITR.utils'
import TimeInput from './TimeInput'
import { TimezoneSelection } from './TimezoneSelection'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FormPanel } from '@/components/ui/Forms/FormPanel'
import { guessLocalTimezone } from '@/lib/dayjs'

type Props = {
  onSubmit: (data: {
    selectedTimezone: string
    recoveryTimeTargetUnix: number
    recoveryTimeString: string
    recoveryTimeStringUtc: string
  }) => void
  earliestAvailableBackupUnix: number
  latestAvailableBackupUnix: number
  disabled?: boolean
}

export function PITRForm({
  onSubmit,
  earliestAvailableBackupUnix,
  latestAvailableBackupUnix,
  disabled = false,
}: Props) {
  const [selectedTimezone, setSelectedTimezone] = useState<string>(guessLocalTimezone)
  const earliestAvailableBackup = dayjs.unix(earliestAvailableBackupUnix ?? 0).tz(selectedTimezone)
  const latestAvailableBackup = dayjs.unix(latestAvailableBackupUnix ?? 0).tz(selectedTimezone)

  // Held as an instant rather than a wall clock so that switching timezone
  // re-renders the same point in time instead of shifting it
  const [selectedUnix, setSelectedUnix] = useState(latestAvailableBackupUnix ?? 0)

  const selectedDate = dayjs.unix(selectedUnix).tz(selectedTimezone)
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

  const isWithinRange =
    !selectedDate.isBefore(earliestAvailableBackup) && !selectedDate.isAfter(latestAvailableBackup)

  const handleSubmit = () => {
    onSubmit({
      selectedTimezone,
      recoveryTimeTargetUnix: selectedDate.unix(),
      recoveryTimeString: selectedDate.format('DD MMM YYYY HH:mm:ss'),
      recoveryTimeStringUtc: selectedDate.utc().format('DD MMM YYYY HH:mm:ss'),
    })
  }

  return (
    <div>
      <FormPanel
        disabled={true}
        footer={
          <div className="flex items-center justify-end gap-3 p-6">
            <ButtonTooltip
              variant="default"
              disabled={disabled || !isWithinRange}
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
        <div className="flex flex-col gap-y-6 lg:flex-row lg:gap-y-0 justify-between px-4 md:px-10 py-6 lg:space-x-10">
          <div className="w-full lg:w-1/3 space-y-2 py-2">
            <p className="text-sm text-foreground">Select a date to restore to</p>
            <Calendar
              mode="single"
              required={true}
              selected={toCalendarDate(selectedDate)}
              onSelect={(date) =>
                setSelectedUnix(withCalendarDate(selectedDate, date, selectedTimezone).unix())
              }
              defaultMonth={toCalendarDate(latestAvailableBackup)}
              startMonth={toCalendarDate(earliestAvailableBackup)}
              endMonth={toCalendarDate(latestAvailableBackup)}
              disabled={[
                { before: toCalendarDate(earliestAvailableBackup) },
                { after: toCalendarDate(latestAvailableBackup) },
              ]}
              classNames={{
                root: 'w-min px-0',
                day: cn(
                  '[&:not(:has(:disabled))]:border [&:not(:has(:disabled))]:border-stronger not-last:border-r-0 [&:not(:has(:disabled))]:bg-overlay-hover',
                  'rounded-none'
                ),
                day_button: 'w-full rounded-none',
                selected: 'bg-brand-500!',
              }}
            />
            {availableDates.length > 1 && (
              <div className="flex items-center space-x-2">
                <div className="border w-4 h-4 border-stronger bg-overlay-hover" />
                <p className="text-xs text-foreground-light">Point in time back up available</p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-2/3">
            <div className="space-y-8 py-2">
              <div className="flex flex-col gap-y-4">
                <p className="text-sm text-foreground">Enter a time to restore to</p>
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
                    {isSelectedOnEarliestDay && (
                      <p className="text-sm text-foreground-lighter">
                        <strong>Earliest backup available for this date</strong>:{' '}
                        {earliestAvailableBackup.format('HH:mm:ss')}
                      </p>
                    )}
                    {isSelectedOnLatestDay && (
                      <p className="text-sm text-foreground-lighter">
                        <strong>Latest backup available for this date</strong>:{' '}
                        {latestAvailableBackup.format('HH:mm:ss')}
                      </p>
                    )}
                    <TimeInput
                      defaultTime={selectedTime}
                      minimumTime={
                        isSelectedOnEarliestDay ? earliestAvailableBackupTime : undefined
                      }
                      maximumTime={isSelectedOnLatestDay ? latestAvailableBackupTime : undefined}
                      onChange={(time) => setSelectedUnix(withTime(selectedDate, time).unix())}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-foreground-light">Database will be restored to:</p>
                <p className="text-3xl">{selectedDate.format('DD MMM YYYY, HH:mm:ss')}</p>

                <p className="text-sm text-foreground-lighter mt-4 text-balance">
                  Backups are captured every 2 minutes, allowing you to enter a time and restore
                  your database to the closest backup point. We'll match the time you enter to the
                  closest backup within the 2-minute window
                </p>
              </div>
            </div>
          </div>
        </div>
      </FormPanel>
    </div>
  )
}
