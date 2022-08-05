import useSWR from 'swr'
import React, { FC, useEffect } from 'react'
import { Loading, Typography } from '@supabase/ui'

import { useProjectSubscription, useStore } from 'hooks'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { get } from 'lib/common/fetch'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usageLimits } from './ProjectUsageBars.constants'
import { UsageStats, ApiUsageStats } from './ProjectUsageBars.types'

interface Props {
  projectRef?: string
}

const ProjectUsage: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const { data: stats, error: usageError } = useSWR(`${API_URL}/projects/${projectRef}/usage`, get)
  const { subscription, isLoading: loading, error } = useProjectSubscription(projectRef)

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${error?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  // [Joshen TODO] After API is ready need to update to include dbEgress, storageEgress
  // And also to highlight in this chart which components are "approaching" and "over"
  const mockUsage: any = {
    dbSize: { value: 10773283, limit: 524288000 },
    dbEgress: { value: 400000000, limit: 524288000 },
    storageSize: { value: 624288000, limit: 524288000 },
    storageEgress: { value: 0, limit: 524288000 },
  }
  // We can try to do up some simple UI logic now while waiting for API

  const tier =
    subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PRO ? 'pro' : 'free'

  return (
    <Loading active={loading}>
      <div className="">
        {Object.values(usageLimits).map((product) => (
          <div
            className="border-panel-border-light dark:border-panel-border-dark mb-8 overflow-hidden rounded border"
            key={product.title}
          >
            <table className="bg-panel-body-light dark:bg-panel-body-dark w-full">
              <thead className="bg-panel-header-light dark:bg-panel-header-dark">
                <tr className="overflow-hidden rounded">
                  <th className="w-1/4 px-6 py-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-scale-500 dark:bg-white">
                        {product.icon}
                      </div>
                      <Typography.Title level={5} className="mb-0">
                        {product.title}
                      </Typography.Title>
                    </div>
                  </th>
                  <th className="hidden p-3 text-left text-xs font-medium leading-4 text-gray-400 lg:table-cell">
                    {/* Plan Limits */}
                  </th>
                  <th className="p-3 text-left text-xs font-medium leading-4 text-gray-400">
                    {/* Usage */}
                  </th>
                </tr>
              </thead>

              {stats === undefined ? (
                <div className="w-96 px-4 pt-1 pb-4">
                  <ShimmeringLoader />
                </div>
              ) : (
                <tbody className="">
                  {product.features.map((feature) => {
                    return (
                      <tr
                        className="border-panel-border-light dark:border-panel-border-dark border-t"
                        key={feature.title}
                      >
                        <td className="text-typography-body-light dark:text-typography-body-dark whitespace-nowrap px-6 py-3 text-sm">
                          {feature.title}
                        </td>
                        <td className="text-typography-body-light dark:text-typography-body-dark hidden w-1/5 whitespace-nowrap p-3 text-sm lg:table-cell">
                          {feature.tiers[tier]?.description(stats)}
                        </td>
                        <td className="text-typography-body-light dark:text-typography-body-dark px-6 py-3 text-sm ">
                          {/* @ts-ignore */}
                          {feature.tiers[tier]?.render ? feature.tiers[tier].render(stats) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )}
            </table>
          </div>
        ))}
      </div>
    </Loading>
  )
}

export default ProjectUsage

interface ProjectUsageMinimalProps extends Props {
  filter: string
}

export const ProjectUsageMinimal: FC<ProjectUsageMinimalProps> = ({ projectRef, filter }) => {
  const { data: apiStats, error: usageError } = useSWR<ApiUsageStats>(
    `${API_URL}/projects/${projectRef}/usage`,
    get
  )
  const { subscription, isLoading: loading, error } = useProjectSubscription(projectRef)
  const stats: UsageStats = {
    authUsers: Number(apiStats?.authUsers),
    bucketSize: Number(apiStats?.bucketSize),
    dbSize: Number(apiStats?.dbSize),
    dbTables: Number(apiStats?.dbTables),
  }

  if (subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PAYG) {
    return <></>
  }

  const tier =
    subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PRO ? 'pro' : 'free'

  return (
    <Loading active={loading}>
      <div className="space-y-4">
        {Object.values(usageLimits)
          .filter((product) => product.title === filter)
          .map((product) => {
            return (
              <div key={product.title}>
                {product.features.map((feature) => {
                  return (
                    <div key={feature.title}>
                      {feature.tiers[tier]?.render && feature.title !== 'Transfer limits' ? (
                        <h5 className="text-scale-900 text-sm">{feature.title}</h5>
                      ) : null}
                      <div className="text-typography-body-light dark:text-typography-body-dark text-sm">
                        {/* @ts-ignore */}
                        {feature.tiers[tier]?.render ? feature.tiers[tier].render(stats) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
      </div>
    </Loading>
  )
}
