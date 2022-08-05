import { IconArchive, IconDatabase } from '@supabase/ui'
import SparkBar from 'components/ui/SparkBar'
import { UsageStats } from './ProjectUsageBars.types'

// [Joshen TODO] These figures are technically wrong, GB and MB are in multiple increments of 1024
const GB = 1000000000
const MB = 1000000

export const usageLimits = {
  database: {
    title: 'Database',
    icon: <IconDatabase className="dark:text-scale-100" size={16} strokeWidth={2} />,
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
    icon: <IconArchive className="dark:text-scale-100" size={16} strokeWidth={2} />,
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
