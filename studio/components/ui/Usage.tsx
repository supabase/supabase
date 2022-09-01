import React, { FC, useEffect } from 'react'
import useSWR from 'swr'
import { Loading } from '@supabase/ui'

import { useProjectSubscription, useStore } from 'hooks'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { get } from 'lib/common/fetch'
import SparkBar from 'components/ui/SparkBar'
import ShimmeringLoader from './ShimmeringLoader'

interface ApiUsageStats {
  authUsers: string | null
  bucketSize: string | null
  dbSize: string | null
  dbTables: string | null
}
interface UsageStats {
  authUsers: number
  bucketSize: number
  dbSize: number
  dbTables: number
}

const GB = 1000000000
const MB = 1000000

const usageLimits = {
  database: {
    title: 'Database',
    icon_src: '/img/database.svg',
    features: [
      {
        title: 'API requests',
        tiers: {
          free: {
            description: () => 'Unlimited',
            render: null,
          },
          pro: {
            description: () => 'Unlimited',
            render: null,
          },
        },
      },
      {
        title: 'Database space',
        tiers: {
          free: {
            description: (stats: UsageStats) =>
              `${((stats.dbSize / (500 * MB)) * 100).toFixed(2)} %`,
            render: (stats: UsageStats) => {
              const bytes: number = stats.dbSize
              const usage = {
                gb: bytes / GB,
                mb: bytes / MB,
              }
              return (
                <SparkBar
                  value={usage.mb}
                  max={500}
                  type={'horizontal'}
                  barClass={'bg-brand-900'}
                  labelBottom={`${usage.mb.toFixed(2).toLocaleString()} MB`}
                  labelTop={`500 MB`}
                />
              )
            },
          },
          pro: {
            description: (stats: UsageStats) =>
              `${((stats.dbSize / (8000 * MB)) * 100).toFixed(2)} %`,
            render: (stats: UsageStats) => {
              const bytes: number = stats.dbSize
              const usage = {
                gb: bytes / GB,
                mb: bytes / MB,
              }
              return (
                <SparkBar
                  value={usage.mb}
                  max={8000}
                  type={'horizontal'}
                  barClass={'bg-brand-900'}
                  labelBottom={`${usage.mb.toFixed(2).toLocaleString()} MB`}
                  labelTop={`8 GB`}
                />
              )
            },
          },
        },
      },
    ],
  },
  storage: {
    title: 'File storage',
    icon_src: '/img/archive.svg',
    features: [
      {
        title: 'Storage space',
        tiers: {
          free: {
            description: (stats: UsageStats) =>
              `${((stats.bucketSize / (1 * GB)) * 100).toFixed(2)}%`,
            render: (stats: UsageStats) => (
              <SparkBar
                value={stats.bucketSize / (1024 * 1024) || 0}
                max={1 * 1024}
                type={'horizontal'}
                barClass={'bg-brand-900'}
                labelBottom={`${(stats.bucketSize / (1024 * 1024)).toLocaleString()} MB`}
                labelTop={`${(1 * 1024).toLocaleString()} MB`}
              />
            ),
          },
          pro: {
            description: (stats: UsageStats) =>
              `${((stats.bucketSize / (100 * GB)) * 100).toFixed(2)}%`,
            render: (stats: UsageStats) => (
              <SparkBar
                value={stats.bucketSize / (1024 * 1024) || 0}
                max={100 * 1024}
                type={'horizontal'}
                barClass={'bg-brand-900'}
                labelBottom={`${(stats.bucketSize / (1024 * 1024)).toLocaleString()} MB`}
                labelTop={`${Number(100).toLocaleString()} GB`}
              />
            ),
          },
        },
      },
      {
        title: 'Transfer limits',
        tiers: {
          free: {
            description: () => `${Number(2).toLocaleString()} GB`,
            render: () => {},
          },
          pro: {
            description: () => `${Number(200).toLocaleString()} GB`,
            render: () => {},
          },
        },
      },
    ],
  },
}

interface ProjectUsageProps {
  projectRef?: string
  subscription_id?: string
}

const ProjectUsage: FC<ProjectUsageProps> = ({ projectRef, subscription_id }) => {
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
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
                        <img width={'16'} src={product.icon_src} />
                      </div>
                      <h5 className="mb-0">{product.title}</h5>
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

interface ProjectUsageMinimalProps extends ProjectUsageProps {
  filter: string
}

export const ProjectUsageMinimal: FC<ProjectUsageMinimalProps> = ({
  projectRef,
  subscription_id,
  filter,
}) => {
  const { data: apiStats, error: usageError } = useSWR<ApiUsageStats>(
    `${API_URL}/projects/${projectRef}/usage`,
    get
  )
  const { subscription, isLoading: loading, error } = useProjectSubscription(projectRef)
  const stats: UsageStats = {
    authUsers: Number(apiStats?.authUsers ?? 0),
    bucketSize: Number(apiStats?.bucketSize ?? 0),
    dbSize: Number(apiStats?.dbSize ?? 0),
    dbTables: Number(apiStats?.dbTables ?? 0),
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
