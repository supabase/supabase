import dayjs from 'dayjs'
import useSWR from 'swr'
import * as Tooltip from '@radix-ui/react-tooltip'
import { FC, useState, useRef, useEffect } from 'react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import generator from 'generate-password'
import { Input, Button, IconDownload, IconArrowRight, Tabs, Modal } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useFlag, useStore } from 'hooks'
import { get, patch } from 'lib/common/fetch'
import { pluckObjectFields, passwordStrength } from 'lib/helpers'
import { API_URL, DEFAULT_MINIMUM_PASSWORD_STRENGTH, TIME_PERIODS_INFRA } from 'lib/constants'

import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import Panel from 'components/ui/Panel'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import ProjectUsageMinimal from 'components/interfaces/Settings/ProjectUsageBars/ProjectUsageMinimal'

const ProjectSettings: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div>
      <div className="content h-full w-full overflow-y-auto">
        <div className="w-full max-w-5xl px-4 py-4">
          <DatabaseUsage project={project} />
        </div>
      </div>
    </div>
  )
}

ProjectSettings.getLayout = (page) => <ReportsLayout title="Database">{page}</ReportsLayout>

export default observer(ProjectSettings)

const DatabaseUsage: FC<any> = ({ project }) => {
  const [dateRange, setDateRange] = useState<any>(undefined)
  const router = useRouter()
  const ref = router.query.ref as string

  return (
    <>
      <div>
        <section className="">
          <Panel
            title={
              <h5 key="panel-title" className="mb-0">
                Database health
              </h5>
            }
          >
            <Panel.Content>
              <div className="mb-4 flex items-center space-x-3">
                <DateRangePicker
                  loading={false}
                  value={'3h'}
                  options={TIME_PERIODS_INFRA}
                  currentBillingPeriodStart={undefined}
                  onChange={setDateRange}
                />
                {dateRange && (
                  <div className="flex items-center space-x-2">
                    <p className="text-scale-1000">
                      {dayjs(dateRange.period_start.date).format('MMMM D, hh:mma')}
                    </p>
                    <p className="text-scale-1000">
                      <IconArrowRight size={12} />
                    </p>
                    <p className="text-scale-1000">
                      {dayjs(dateRange.period_end.date).format('MMMM D, hh:mma')}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'ram_usage'}
                    label={'Memory usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'cpu_usage'}
                    label={'CPU usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'disk_io_budget'}
                    label={'Daily Disk IO Budget remaining'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}
              </div>
            </Panel.Content>
          </Panel>
        </section>
      </div>
    </>
  )
}
