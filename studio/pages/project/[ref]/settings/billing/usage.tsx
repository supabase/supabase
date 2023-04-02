import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { FC, useEffect, useState } from 'react'
import { IconArrowRight, Loading } from 'ui'

import { Project, NextPageWithLayout } from 'types'
import { useStore } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { STRIPE_PRODUCT_IDS, TIME_PERIODS_REPORTS, TIME_PERIODS_BILLING } from 'lib/constants'
import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import { PAYGUsage } from 'components/interfaces/Billing'
import ProjectUsageBars from 'components/interfaces/Settings/ProjectUsageBars/ProjectUsageBars'

const ProjectBillingUsage: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div className="w-full h-full overflow-y-auto content">
      <div className="w-full mx-auto">
        <Settings project={project} />
      </div>
    </div>
  )
}

ProjectBillingUsage.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBillingUsage)

interface SettingsProps {
  project?: Project
}

const Settings: FC<SettingsProps> = ({ project }) => {
  const { ui } = useStore()

  const {
    data: subscription,
    isLoading: loading,
    error,
  } = useProjectSubscriptionQuery({ projectRef: ui.selectedProject?.ref })

  const [dateRange, setDateRange] = useState<any>()
  const isPayg = subscription?.tier?.prod_id === STRIPE_PRODUCT_IDS.PAYG

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${(error as any)?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      {loading ? (
        <Loading active={loading}>
          <div className="w-full mb-8 overflow-hidden border rounded border-panel-border-light dark:border-panel-border-dark">
            <div className="flex items-center justify-center px-6 py-6 bg-panel-body-light dark:bg-panel-body-dark">
              <p>Loading usage breakdown</p>
            </div>
          </div>
        </Loading>
      ) : isPayg ? (
        <div>
          <div className="flex items-center mb-4 space-x-3">
            <DateRangePicker
              onChange={setDateRange}
              value={TIME_PERIODS_BILLING[0].key}
              options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
              loading={loading}
              currentBillingPeriodStart={subscription?.billing.current_period_start}
            />
            {dateRange && (
              <div className="flex items-center space-x-2">
                <p className="text-scale-1000">
                  {dayjs(dateRange.period_start.date).format('MMM D, YYYY')}
                </p>
                <p className="text-scale-1000">
                  <IconArrowRight size={12} />
                </p>
                <p className="text-scale-1000">
                  {dayjs(dateRange.period_end.date).format('MMM D, YYYY')}
                </p>
              </div>
            )}
          </div>
          {dateRange && <PAYGUsage dateRange={dateRange} />}
        </div>
      ) : (
        <ProjectUsageBars projectRef={project?.ref} />
      )}
    </div>
  )
}
