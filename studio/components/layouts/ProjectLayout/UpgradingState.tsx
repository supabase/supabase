import dayjs from 'dayjs'
import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconCircle, IconCheckCircle, IconSettings } from 'ui'
import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'

import { useParams, useStore } from 'hooks'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'

// [Joshen] If a project upgrade fails, the status of a project goes back to ACTIVE_HEALTHY as the
// original project is untouched, hence the "upgrade failure" state will be handled on the project home page

const UpgradingState = () => {
  const { ref } = useParams()
  const { app, ui, meta } = useStore()
  const [loading, setLoading] = useState(false)
  const { data } = useProjectUpgradingStatusQuery({ projectRef: ref })

  const project = ui.selectedProject
  const { initiated_at, status } = data?.databaseUpgradeStatus ?? {}
  const isCompleted = status === DatabaseUpgradeStatus.Upgraded
  const initiatedAt = dayjs(initiated_at ?? 0).format('DD MMM YYYY HH:mm:ss (ZZ)')
  const initiatedAtUTC = dayjs(initiated_at ?? 0)
    .utc()
    .format('DD MMM YYYY HH:mm:ss')

  const onConfirm = async () => {
    setLoading(true)
    await app.projects.fetchDetail(project?.ref ?? '', (project) => meta.setProjectDetails(project))
  }

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
                  <p className="mt-4 text-center text-sm text-scale-1100">
                    Your project has been successfully upgraded and is now back online.
                  </p>
                </div>
                <div className="mx-auto">
                  <Button loading={loading} disabled={loading} onClick={onConfirm}>
                    Return to project
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid w-[400px] gap-4">
                <div className="relative mx-auto max-w-[300px]">
                  <div className="absolute flex h-full w-full items-center justify-center">
                    <IconSettings className="animate-spin" size={20} strokeWidth={2} />
                  </div>
                  <IconCircle className="text-scale-900" size={50} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <p className="text-center">Upgrading in progress</p>
                  <p className="text-center text-sm text-scale-1100">
                    Upgrades will take a few minutes depending on the size of your database. Your
                    project will be offline while it is being upgraded.
                  </p>

                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger className="w-full">
                      <p className="!mt-3 text-center text-sm text-scale-1000">
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
