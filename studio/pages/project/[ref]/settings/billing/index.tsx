import dayjs from 'dayjs'
import { FC, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography, Loading, IconArrowRight } from '@supabase/ui'

import { useProjectPaygStatistics, useProjectSubscription, useStore, withAuth } from 'hooks'
import { STRIPE_PRODUCT_IDS, TIME_PERIODS_REPORTS, TIME_PERIODS_BILLING } from 'lib/constants'
import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import { PAYGUsage, Subscription, Invoices } from 'components/interfaces/Billing'

import ProjectUsage from 'components/to-be-cleaned/Usage'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'

type ProjectBillingProps = {} & any
const ProjectBilling: FC<ProjectBillingProps> = ({ store }) => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <SettingsLayout title="Billing and Usage">
      <div className="content w-full h-full overflow-y-auto">
        <div className="mx-auto w-full">
          <Settings project={project} />
        </div>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(ProjectBilling))

type SettingsProps = {
  project: any
}
const Settings: FC<SettingsProps> = ({ project }) => {
  const { ui } = useStore()
  const {
    subscription,
    isLoading: loading,
    error,
  } = useProjectSubscription(ui.selectedProject?.ref)
  const { paygStats } = useProjectPaygStatistics(
    ui.selectedProject?.ref,
    subscription?.tier?.supabase_prod_id
  )
  const [dateRange, setDateRange] = useState<any>()

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${error?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="p-4 container max-w-4xl space-y-8">
      <Subscription
        loading={loading}
        project={project}
        subscription={subscription}
        paygStats={paygStats}
        currentPeriodStart={subscription?.billing.current_period_start}
        currentPeriodEnd={subscription?.billing.current_period_end}
      />
      {loading ? (
        <Loading active={loading}>
          <div className="w-full rounded overflow-hidden border border-panel-border-light dark:border-panel-border-dark mb-8">
            <div className="px-6 py-6 bg-panel-body-light dark:bg-panel-body-dark flex items-center justify-center">
              <Typography.Text>Loading usage breakdown</Typography.Text>
            </div>
          </div>
        </Loading>
      ) : subscription?.tier?.prod_id === STRIPE_PRODUCT_IDS.PAYG ? (
        <div>
          <div className="flex space-x-3 items-center mb-4">
            <DateRangePicker
              onChange={setDateRange}
              value={TIME_PERIODS_BILLING[0].key}
              options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
              loading={loading}
              currentBillingPeriodStart={subscription?.billing.current_period_start}
            />
            {dateRange && (
              <div className="flex space-x-2 items-center">
                <Typography.Text type="secondary">
                  {dayjs(dateRange.period_start.date).format('MMM D, YYYY')}
                </Typography.Text>
                <Typography.Text type="secondary" className="opacity-50">
                  <IconArrowRight size={12} />
                </Typography.Text>
                <Typography.Text type="secondary">
                  {dayjs(dateRange.period_end.date).format('MMM D, YYYY')}
                </Typography.Text>
              </div>
            )}
          </div>
          {paygStats && <PAYGUsage paygStats={paygStats} />}
        </div>
      ) : (
        <ProjectUsage projectRef={project.ref} subscription_id={project.subscription_id} />
      )}
      <div className="space-y-2">
        <h4 className="text-lg">Invoices</h4>
        <Invoices projectRef={ui.selectedProject?.ref ?? ''} />
      </div>
    </div>
  )
}
