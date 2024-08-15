import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import DatePicker from 'react-datepicker'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import InformationBox from 'components/ui/InformationBox'
import { useBackupsQuery } from 'data/database/backups-query'
import { usePitrRestoreMutation } from 'data/database/pitr-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Modal,
  WarningIcon,
} from 'ui'
import BackupsEmpty from '../BackupsEmpty'
import BackupsStorageAlert from '../BackupsStorageAlert'
import type { Timezone } from './PITR.types'
import {
  constrainDateToRange,
  formatNumberToTwoDigits,
  getClientTimezone,
  getDatesBetweenRange,
} from './PITR.utils'
import PITRStatus from './PITRStatus'
import TimeInput from './TimeInput'
import { TimezoneSelection } from './TimezoneSelection'

const PITRSelection = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryClient = useQueryClient()

  const { data: backups } = useBackupsQuery({ projectRef: ref })
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })
  const [showConfiguration, setShowConfiguration] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getClientTimezone())

  const canTriggerPhysicalBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const hasReadReplicas = (databases ?? []).length > 1

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
      <BackupsStorageAlert />
      {hasNoBackupsAvailable ? (
        <BackupsEmpty />
      ) : (
        <>
          {hasReadReplicas && (
            <Alert_Shadcn_ variant="warning">
              <WarningIcon />
              <AlertTitle_Shadcn_>
                Unable to restore from PITR as project has read replicas enabled
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                You will need to remove all read replicas first from your project's infrastructure
                settings prior to starting a PITR restore.
              </AlertDescription_Shadcn_>
              <div className="flex items-center gap-x-2 mt-2">
                {/* [Joshen] Ideally we have some links to a docs to explain why so */}
                {/* <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Documentation
                </Button> */}
                <Button type="default">
                  <Link href={`/project/${ref}/settings/infrastructure`}>
                    Infrastructure settings
                  </Link>
                </Button>
              </div>
            </Alert_Shadcn_>
          )}
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

                  <ButtonTooltip
                    type="warning"
                    disabled={isSelectedOutOfRange || !selectedDate || !canTriggerPhysicalBackups}
                    onClick={() => setShowConfirmation(true)}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: isSelectedOutOfRange
                          ? 'Selected date is out of range where backups are available'
                          : !canTriggerPhysicalBackups
                            ? 'You need additional permissions to trigger a restore'
                            : undefined,
                      },
                    }}
                  >
                    Review restore details
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
                          icon={<HelpCircle size={14} strokeWidth={2} />}
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
        <Modal.Content>
          <div className="py-2 space-y-1">
            <p className="text-sm text-foreground-light">Your database will be restored to:</p>
          </div>
          <div className="py-2 flex flex-col gap-3">
            <div>
              <p className="text-sm font-mono text-foreground-lighter">{selectedTimezone?.text}</p>
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
            title="This action cannot be undone, not canceled once started"
          >
            Any changes made to your database after this point in time will be lost. This includes
            any changes to your project's storage and authentication.
          </Alert>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <p className="text-sm text-foreground-light">
            Restores may take from a few minutes up to several hours depending on the size of your
            database. During this period, your project will not be available, until the restoration
            is completed.
          </p>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default PITRSelection
