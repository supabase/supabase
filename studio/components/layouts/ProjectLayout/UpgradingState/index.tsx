import dayjs from 'dayjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  Button,
  IconCircle,
  IconCheckCircle,
  IconSettings,
  IconAlertCircle,
  IconLoader,
  IconCheck,
  IconMaximize2,
  IconMinimize2,
} from 'ui'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'

import { useParams, useStore } from 'hooks'
import { DATABASE_UPGRADE_MESSAGES } from './UpgradingState.constants'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'

const UpgradingState = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  // [Joshen] If routing to this state from ProjectUpgradeAlert, give it a few seconds before starting
  // to poll the upgrade status endpoint as the job is async and might not be immediately updated.
  const { upgradeInitiated } = useParams()
  const [isInitialized, setIsInitialized] = useState(upgradeInitiated !== 'true')

  useEffect(() => {
    if (!isInitialized) setTimeout(() => setIsInitialized(true), 5000)
  }, [])

  if (isInitialized) {
    return <UpgradingPollingState />
  } else {
    return (
      <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
        <div className="mx-6 space-y-16">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
            <h1 className="text-3xl">{project?.name}</h1>
          </div>
          <div className="mx-auto mt-8 mb-16 w-full max-w-7xl">
            <div className="flex h-[500px] items-center justify-center rounded border border-scale-400 bg-scale-300 p-8">
              <div className="grid w-[480px] gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <div className="absolute flex h-full w-full items-center justify-center">
                    <IconSettings className="animate-spin" size={20} strokeWidth={2} />
                  </div>
                  <IconCircle className="text-scale-900" size={50} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">Upgrading in progress</p>
                  <p className="text-center text-sm text-scale-1100">
                    Upgrades can take from a few minutes up to several hours depending on the size
                    of your database. Your project will be offline while it is being upgraded.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const UpgradingPollingState = () => {
  const { ref } = useParams()
  const { app, ui, meta } = useStore()
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref })

  const project = ui.selectedProject
  const { initiated_at, status, progress, target_version, error } =
    data?.databaseUpgradeStatus ?? {}
  const progressStage = Number((progress || '').split('_')[0])

  const isFailed = status === DatabaseUpgradeStatus.Failed
  const isCompleted = status === DatabaseUpgradeStatus.Upgraded

  const initiatedAt = dayjs(initiated_at ?? 0).format('DD MMM YYYY HH:mm:ss (ZZ)')
  const initiatedAtUTC = dayjs(initiated_at ?? 0)
    .utc()
    .format('DD MMM YYYY HH:mm:ss')

  const refetchProjectDetails = async () => {
    setLoading(true)
    await app.projects.fetchDetail(project?.ref ?? '', (project) => meta.setProjectDetails(project))
  }

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Target Version: ${target_version}%0A• Error: ${error}`

  return (
    <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
      <div className="mx-6 space-y-16">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
          <h1 className="text-3xl">{project?.name}</h1>
        </div>
        <div className="mx-auto mt-8 mb-16 w-full max-w-7xl">
          <div className="flex h-[500px] items-center justify-center rounded border border-scale-400 bg-scale-300 p-8">
            {isCompleted ? (
              <div className="grid gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <IconCheckCircle className="text-brand-900" size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">Upgrade completed!</p>
                  <p className="mt-4 text-center text-sm text-scale-1100 w-[300px] mx-auto">
                    Your project has been successfully upgraded to Postgres {target_version} and is
                    now back online.
                  </p>
                </div>
                <div className="mx-auto">
                  <Button loading={loading} disabled={loading} onClick={refetchProjectDetails}>
                    Return to project
                  </Button>
                </div>
              </div>
            ) : isFailed ? (
              <div className="grid gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <IconAlertCircle className="text-amber-900" size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">We ran into an issue while upgrading your project</p>
                  <p className="mt-4 text-center text-sm text-scale-1100 w-[450px] mx-auto">
                    Your project is back online and its data is not affected. Please reach out to us
                    via our support form for assistance with the upgrade.
                  </p>
                </div>
                <div className="flex items-center mx-auto space-x-2">
                  <Link
                    href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
                  >
                    <a target="_blank">
                      <Button type="default">Contact support</Button>
                    </a>
                  </Link>
                  <Button loading={loading} disabled={loading} onClick={refetchProjectDetails}>
                    Return to project
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid w-[480px] gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <div className="absolute flex h-full w-full items-center justify-center">
                    <IconSettings className="animate-spin" size={20} strokeWidth={2} />
                  </div>
                  <IconCircle className="text-scale-900" size={50} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">Upgrading in progress</p>
                  <p className="text-center text-sm text-scale-1100">
                    Upgrades can take from a few minutes up to several hours depending on the size
                    of your database. Your project will be offline while it is being upgraded.
                  </p>

                  <div
                    className="!mt-4 !mb-2 py-3 px-4 transition-all overflow-hidden border rounded relative"
                    style={{ maxHeight: isExpanded ? '500px' : '110px' }}
                  >
                    {isExpanded ? (
                      <IconMinimize2
                        size="tiny"
                        strokeWidth={2}
                        className="absolute top-3 right-3 cursor-pointer z-10"
                        onClick={() => setIsExpanded(false)}
                      />
                    ) : (
                      <IconMaximize2
                        size="tiny"
                        strokeWidth={2}
                        className="absolute top-3 right-3 cursor-pointer z-10"
                        onClick={() => setIsExpanded(true)}
                      />
                    )}
                    <div
                      className="space-y-2 transition-all"
                      style={{
                        translate: isExpanded
                          ? '0px 0px'
                          : `0px ${
                              (progressStage - 2 <= 0
                                ? 0
                                : progressStage > 7
                                ? 6
                                : progressStage - 2) * -28
                            }px`,
                      }}
                    >
                      {DATABASE_UPGRADE_MESSAGES.map((message, idx: number) => {
                        const isCurrent = message.key === progress
                        const isCompleted = progressStage > idx
                        return (
                          <div key={message.key} className="flex items-center space-x-4">
                            {isCurrent ? (
                              <div className="h-5 w-5 flex items-center justify-center rounded-full">
                                <IconLoader
                                  size={20}
                                  className="animate-spin text-scale-1100"
                                  strokeWidth={2}
                                />
                              </div>
                            ) : isCompleted ? (
                              <div className="h-5 w-5 flex items-center justify-center rounded-full border bg-brand-800 border-brand-700">
                                <IconCheck size={12} className="text-white" strokeWidth={2} />
                              </div>
                            ) : (
                              <div className="h-5 w-5 flex items-center justify-center border rounded-full bg-scale-600" />
                            )}
                            <p
                              className={`text-sm ${
                                isCurrent
                                  ? 'text-scale-1200'
                                  : isCompleted
                                  ? 'text-scale-1100'
                                  : 'text-scale-1000'
                              } hover:text-scale-1200 transition`}
                            >
                              {isCurrent
                                ? message.progress
                                : isCompleted
                                ? message.completed
                                : message.initial}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger className="w-full">
                      <p className="text-center text-sm text-scale-1000">
                        Started on: {initiatedAtUTC} (UTC)
                      </p>
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                          'border border-scale-200 ', //border
                        ].join(' ')}
                      >
                        <span className="text-xs text-scale-1200">{initiatedAt}</span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpgradingState
