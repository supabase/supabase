import dayjs from 'dayjs'
import DatePicker from 'react-datepicker'
import { useState } from 'react'
import { format } from 'date-fns'
import { observer } from 'mobx-react-lite'
import {
  Button,
  Modal,
  IconChevronLeft,
  IconChevronRight,
  IconHelpCircle,
  IconDatabase,
} from '@supabase/ui'

import { useStore } from 'hooks'

import { Time } from './PITR.types'
import { getClientTimezone, checkMatchingDates, formatNumberToTwoDigits } from './PITR.utils'
import PITRStatus from './PITRStatus'
import TimeInput from './TimeInput'
import TimezoneSelection from './TimezoneSelection'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import InformationBox from 'components/ui/InformationBox'

// [Joshen TODO] Remaining todos:
// - Need to validate the selectedDate against earliest and latest here to disable the review restore details button
// - Refine messaging in confirmation modal
// - Actually hook up the BE API, please ensure that the unix timestamp getting sent is correct
// - Highlight available dates in the calendar and add a legend
// - Just need to check in thereafter with Jonny if the changes are okay
// - Deprecate old PITR components
// - Be sure to go through any other [Joshen TODO] mentions

const PITRSelection = ({}) => {
  const { backups } = useStore()
  const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
    backups?.configuration?.physicalBackupData ?? {}

  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTimezone, setSelectedTimezone] = useState(getClientTimezone())
  const [showConfiguration, setShowConfiguration] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const formattedSelectedDate = dayjs.unix(Number(selectedDate) / 1000)
  // Should only convert to timezone at when confirming
  // const formattedSelectedDate = dayjs.unix(Number(selectedDate) / 1000).tz(selectedTimezone?.utc[0])

  const earliestAvailableBackup = new Date(earliestPhysicalBackupDateUnix * 1000)
  const earliestAvailableTiming = dayjs(earliestAvailableBackup).tz(selectedTimezone?.utc[0])

  const latestAvailableBackup = new Date(latestPhysicalBackupDateUnix * 1000)
  const latestAvailableTiming = dayjs(latestAvailableBackup).tz(selectedTimezone?.utc[0])

  const isSelectedOnEarliest = checkMatchingDates(selectedDate, earliestAvailableBackup)
  const isSelectedOnLatest = checkMatchingDates(selectedDate, latestAvailableBackup)

  const formattedSelectedTiming =
    selectedDate !== undefined
      ? {
          h: formatNumberToTwoDigits(selectedDate.getHours()),
          m: formatNumberToTwoDigits(selectedDate.getMinutes()),
          s: formatNumberToTwoDigits(selectedDate.getSeconds()),
        }
      : undefined

  const formattedEarliestTiming = isSelectedOnEarliest
    ? {
        h: formatNumberToTwoDigits(earliestAvailableTiming.hour()),
        m: formatNumberToTwoDigits(earliestAvailableTiming.minute()),
        s: formatNumberToTwoDigits(earliestAvailableTiming.second()),
      }
    : undefined

  const formattedLatestTiming = isSelectedOnLatest
    ? {
        h: formatNumberToTwoDigits(latestAvailableTiming.hour()),
        m: formatNumberToTwoDigits(latestAvailableTiming.minute()),
        s: formatNumberToTwoDigits(latestAvailableTiming.second()),
      }
    : undefined

  const onCancel = () => {
    setSelectedDate(undefined)
    setSelectedTimezone(getClientTimezone())
    setShowConfiguration(false)
  }

  const onUpdateDate = (date: Date) => {
    const isSelectedOnEarliest = checkMatchingDates(date, earliestAvailableBackup)
    const isSelectedOnLatest = checkMatchingDates(selectedDate, latestAvailableBackup)

    if (isSelectedOnEarliest) {
      date.setHours(
        earliestAvailableTiming.hour(),
        earliestAvailableTiming.minute(),
        earliestAvailableTiming.second(),
        0
      )
    } else if (isSelectedOnLatest) {
      date.setHours(
        latestAvailableTiming.hour(),
        latestAvailableTiming.minute(),
        latestAvailableTiming.second(),
        0
      )
    } else {
      date.setHours(0, 0, 0, 0)
    }

    setSelectedDate(date)
  }

  const onUpdateTime = (time: Time) => {
    if (!selectedDate) return
    const updatedDate = new Date(Number(selectedDate))
    updatedDate.setHours(Number(time.h))
    updatedDate.setMinutes(Number(time.m))
    updatedDate.setSeconds(Number(time.s))
    setSelectedDate(updatedDate)
  }

  const onConfirmRestore = async () => {
    // Refer to PITRBackupSelection.tsx for logic here
  }

  return (
    <>
      <FormHeader
        title="Restore your database from a backup"
        description="Database changes are watched and recorded, so that you can restore your database to any point in time"
      />
      {!showConfiguration ? (
        <PITRStatus onSetConfiguration={() => setShowConfiguration(true)} />
      ) : (
        <FormPanel
          disabled={true}
          footer={
            <div className="flex items-center justify-end gap-3 p-6">
              <Button type="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="warning" onClick={() => setShowConfirmation(true)}>
                Review restore details
              </Button>
            </div>
          }
        >
          <div className="flex justify-between px-10 py-6 space-x-10">
            <div className="w-1/3 space-y-2">
              {/* Highlight the available dates better */}
              <DatePicker
                inline
                selected={selectedDate}
                onChange={onUpdateDate}
                dayClassName={() => 'cursor-pointer'}
                minDate={earliestAvailableBackup}
                maxDate={latestAvailableBackup}
                // highlightDates={[new Date()]}
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
                      <span className="text-scale-1100 text-sm">{format(date, 'MMMM yyyy')}</span>
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
                      {formattedSelectedDate.format('DD MMM YYYY, HH:mm:ss')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-scale-1100">Time of recovery</p>
                    <div className="w-[310px]">
                      <TimezoneSelection
                        hideLabel
                        dropdownWidth="w-[350px]"
                        selectedTimezone={selectedTimezone}
                        onSelectTimezone={setSelectedTimezone}
                      />
                    </div>

                    <TimeInput
                      defaultTime={formattedSelectedTiming}
                      minimumTime={formattedEarliestTiming}
                      maximumTime={formattedLatestTiming}
                      onChange={onUpdateTime}
                    />

                    <div className="!mt-4 space-y-1">
                      {isSelectedOnEarliest && (
                        <p className="text-sm text-scale-1000">
                          Earliest available backup on this date is at{' '}
                          {earliestAvailableTiming.format('HH:mm:ss')}
                        </p>
                      )}
                      {isSelectedOnLatest && (
                        <p className="text-sm text-scale-1000">
                          Latest available backup on this date is at{' '}
                          {latestAvailableTiming.format('HH:mm:ss')}
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
      <Modal
        closable
        size="medium"
        visible={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        customFooter={
          <div className="flex items-center justify-end space-x-2">
            <Button type="default" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button type="warning" onClick={onConfirmRestore}>
              I understand, begin restore
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-3">
          <Modal.Content>
            <p>Point in time recovery review</p>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="py-2 space-y-1">
              <p className="text-sm text-scale-1100"> Your database will be restored to</p>
              <p className="text-2xl">{formattedSelectedDate.format('DD MMM YYYY, HH:mm:ss')}</p>
              <p className="text-lg">{selectedTimezone?.text}</p>
            </div>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="py-2 space-y-3">
              <p className="text-sm text-scale-1100">
                Any changes made to your database up to this point of time will be lost. This
                includes any changes involving storage and authentication.
              </p>
              <p className="text-sm text-scale-1100">
                The restoration process will incur some downtime to your project and cannot be
                undone.
              </p>
              {/* <div className="flex space-x-5">
                <div className="w-10 h-10 rounded bg-scale-1200">
                  <IconDatabase strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm">Potential loss of recent data</p>
                  <p className="text-sm text-scale-1100">
                    Any database changes being made currently could be lost.
                  </p>
                </div>
              </div>
              <div className="flex space-x-5">
                <div className="w-10 h-10 rounded bg-scale-1200" />
                <div>
                  <p className="text-sm">Potential loss of new users</p>
                  <p className="text-sm text-scale-1100">
                    Users that recently signed up to your project could be lost.
                  </p>
                </div>
              </div>
              <div className="flex space-x-5">
                <div className="w-10 h-10 rounded bg-scale-1200" />
                <div>
                  <p className="text-sm">Potential loss of storage files</p>
                  <p className="text-sm text-scale-1100">
                    Any files recently uploaded to your storage could be lost.
                  </p>
                </div>
              </div> */}
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default observer(PITRSelection)
