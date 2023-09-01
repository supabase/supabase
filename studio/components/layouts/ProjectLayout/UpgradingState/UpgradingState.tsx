import * as Tooltip from '@radix-ui/react-tooltip'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  IconAlertCircle,
  IconCheck,
  IconCheckCircle,
  IconCircle,
  IconLoader,
  IconMaximize2,
  IconMinimize2,
  IconSettings,
} from 'ui'

import { useParams } from 'common/hooks'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import { getProjectDetail, invalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useProjectContext } from '../ProjectContext'
import { DATABASE_UPGRADE_MESSAGES } from './UpgradingState.constants'
import { useQueryClient } from '@tanstack/react-query'

const UpgradingState = () => {
  const { ref } = useParams()
  const { meta } = useStore()
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { data } = useProjectUpgradingStatusQuery(
    {
      projectRef: ref,
      projectStatus: project?.status,
    },
    {
      enabled: IS_PLATFORM,
    }
  )

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

    const projectDetail = await getProjectDetail({ ref })
    if (projectDetail) meta.setProjectDetails(projectDetail)
    if (ref) await invalidateProjectDetailsQuery(queryClient, ref)
  }

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiated_at}%0A• Target Version: ${target_version}%0A• Error: ${error}`

  return (
    <div className="w-full mx-auto my-16 space-y-16 max-w-7xl">
      <div className="mx-6 space-y-16">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
          <h1 className="text-3xl">{project?.name}</h1>
        </div>
        <div className="w-full mx-auto mt-8 mb-16 max-w-7xl">
          <div className="flex h-[500px] items-center justify-center rounded border border-scale-400 bg-scale-300 p-8">
            {isCompleted ? (
              <div className="grid gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <IconCheckCircle className="text-brand" size={40} strokeWidth={1.5} />
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
                    <a target="_blank" rel="noreferrer">
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
                  <div className="absolute flex items-center justify-center w-full h-full">
                    <IconSettings className="animate-spin" size={20} strokeWidth={2} />
                  </div>
                  <IconCircle className="text-scale-900" size={50} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">Upgrading in progress</p>
                  <p className="text-sm text-center text-scale-1100">
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
                        className="absolute z-10 cursor-pointer top-3 right-3"
                        onClick={() => setIsExpanded(false)}
                      />
                    ) : (
                      <IconMaximize2
                        size="tiny"
                        strokeWidth={2}
                        className="absolute z-10 cursor-pointer top-3 right-3"
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
                                : progressStage > 6
                                ? 5
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
                              <div className="flex items-center justify-center w-5 h-5 rounded-full">
                                <IconLoader
                                  size={20}
                                  className="animate-spin text-scale-1100"
                                  strokeWidth={2}
                                />
                              </div>
                            ) : isCompleted ? (
                              <div className="flex items-center justify-center w-5 h-5 border rounded-full bg-brand-300 border-brand-400">
                                <IconCheck size={12} className="text-white" strokeWidth={2} />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-5 h-5 border rounded-full bg-scale-600" />
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

                  {initiated_at !== undefined && (
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger className="w-full">
                        <p className="text-sm text-center text-scale-1000">
                          Started on: {initiatedAtUTC} (UTC)
                        </p>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
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
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  )}
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
