import React, { FC, useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loading, Typography } from '@supabase/ui'

import { useProjectSubscription, useStore } from 'hooks'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { get, post } from 'lib/common/fetch'
import SparkBar from 'components/ui/SparkBar'

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
            description: (stats: any) =>
              `${(((stats?.dbSize || 0) / (500 * MB)) * 100).toFixed(2)} %`,
            render: (stats: any) => {
              const bytes: any = stats?.dbSize ? new Number(stats?.dbSize) : 0
              const usage = {
                gb: bytes / GB || 0,
                mb: bytes / MB || 0,
              }
              return (
                <SparkBar
                  value={usage.mb}
                  max={500}
                  type={'horizontal'}
                  barClass={'bg-brand-900'}
                  labelBottom={`${new Number(usage.mb).toFixed(2).toLocaleString()} MB`}
                  labelTop={`500 MB`}
                />
              )
            },
          },
          pro: {
            description: (stats: any) =>
              `${(((stats?.dbSize || 0) / (8000 * MB)) * 100).toFixed(2)} %`,
            render: (stats: any) => {
              const bytes: any = stats?.dbSize ? new Number(stats?.dbSize) : 0
              const usage = {
                gb: bytes / GB || 0,
                mb: bytes / MB || 0,
              }
              return (
                <SparkBar
                  value={usage.mb}
                  max={8000}
                  type={'horizontal'}
                  barClass={'bg-brand-900'}
                  labelBottom={`${new Number(usage.mb).toFixed(2).toLocaleString()} MB`}
                  labelTop={`8 GB`}
                />
              )
            },
          },
        },
      },
    ],
  },
  auth: {
    title: 'Auth',
    icon_src: '/img/key.svg',
    features: [
      {
        title: 'Users',
        tiers: {
          free: {
            description: (stats: any) => `${(((stats?.authUsers || 0) / 10000) * 100).toFixed(2)}%`,
            render: (stats: any) => (
              <SparkBar
                value={stats?.authUsers || 0}
                max={10000}
                type={'horizontal'}
                barClass={'bg-brand-900'}
                labelBottom={stats?.authUsers ? new Number(stats?.authUsers).toLocaleString() : '0'}
                labelTop={`${new Number(10000).toLocaleString()}`}
              />
            ),
          },
          pro: {
            description: (stats: any) =>
              `${(((stats?.authUsers || 0) / 100000) * 100).toFixed(2)}%`,
            render: (stats: any) => (
              <SparkBar
                value={stats?.authUsers || 0}
                max={100000}
                type={'horizontal'}
                barClass={'bg-brand-900'}
                labelBottom={stats?.authUsers ? new Number(stats?.authUsers).toLocaleString() : '0'}
                labelTop={`${new Number(100000).toLocaleString()}`}
              />
            ),
          },
        },
      },
      {
        title: 'Auth confirmation emails',
        tiers: {
          free: {
            description: () => `${new Number(1000).toLocaleString()}/month`,
            render: null,
          },
          pro: {
            description: () => `${new Number(30000).toLocaleString()}/month`,
            render: null,
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
            description: (stats: any) =>
              `${(((stats?.bucketSize || 0) / (1 * GB)) * 100).toFixed(2)}%`,
            render: (stats: any) => (
              <SparkBar
                value={stats?.bucketSize / (1024 * 1024) || 0}
                max={1 * 1024}
                type={'horizontal'}
                barClass={'bg-brand-900'}
                labelBottom={
                  stats?.bucketSize
                    ? `${new Number(stats?.bucketSize / (1024 * 1024)).toLocaleString()} MB`
                    : '0'
                }
                labelTop={`${new Number(1 * 1024).toLocaleString()} MB`}
              />
            ),
          },
          pro: {
            description: (stats: any) =>
              `${(((stats?.bucketSize || 0) / (100 * GB)) * 100).toFixed(2)}%`,
            render: (stats: any) => (
              <SparkBar
                value={stats?.bucketSize / (1024 * 1024) || 0}
                max={100 * 1024}
                type={'horizontal'}
                barClass={'bg-brand-900'}
                labelBottom={
                  stats?.bucketSize
                    ? `${new Number(stats?.bucketSize / (1024 * 1024)).toLocaleString()} MB`
                    : '0'
                }
                labelTop={`${new Number(100).toLocaleString()} GB`}
              />
            ),
          },
        },
      },
      {
        title: 'Transfer limits',
        tiers: {
          free: {
            description: () => `${new Number(2).toLocaleString()} GB`,
            render: () => {},
          },
          pro: {
            description: () => `${new Number(200).toLocaleString()} GB`,
            render: () => {},
          },
        },
      },
    ],
  },
}

const ProjectUsage: FC<any> = ({ projectRef, subscription_id }) => {
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
            className="rounded overflow-hidden border border-panel-border-light dark:border-panel-border-dark mb-8"
            key={product.title}
          >
            <table className="w-full bg-panel-body-light dark:bg-panel-body-dark">
              <thead className="bg-panel-header-light dark:bg-panel-header-dark">
                <tr className="rounded overflow-hidden">
                  <th className="px-6 py-3 text-left w-1/4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                        <img width={'16'} src={product.icon_src} />
                      </div>
                      <Typography.Title level={5} className="mb-0">
                        {product.title}
                      </Typography.Title>
                    </div>
                  </th>
                  <th className="p-3 text-xs leading-4 font-medium text-gray-400 text-left hidden lg:table-cell">
                    {/* Plan Limits */}
                  </th>
                  <th className="p-3 text-xs leading-4 font-medium text-gray-400 text-left">
                    {/* Usage */}
                  </th>
                </tr>
              </thead>

              <tbody className="">
                {product.features.map((feature) => {
                  return (
                    <tr
                      className="border-t border-panel-border-light dark:border-panel-border-dark"
                      key={feature.title}
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-typography-body-light dark:text-typography-body-dark">
                        {feature.title}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm text-typography-body-light dark:text-typography-body-dark hidden lg:table-cell w-1/5">
                        {feature.tiers[tier]?.description(stats)}
                      </td>
                      <td className="px-6 py-3 text-sm text-typography-body-light dark:text-typography-body-dark ">
                        {/* @ts-ignore */}
                        {feature.tiers[tier]?.render ? feature.tiers[tier].render(stats) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Loading>
  )
}

export default ProjectUsage

export const ProjectUsageMinimal: FC<any> = ({ projectRef, subscription_id, filter }) => {
  const { data: stats, error: usageError } = useSWR(`${API_URL}/projects/${projectRef}/usage`, get)
  const { subscription, isLoading: loading, error } = useProjectSubscription(projectRef)

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
                      <div className="text-sm text-typography-body-light dark:text-typography-body-dark">
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
