import { WORKERS_REGION } from '@/components/interfaces/Workers/Workers.constants'
import type { Worker } from '@/components/interfaces/Workers/Workers.types'

// Timestamps derive from a fixed base rather than Date.now() so SSR and client render identically.
const SEED_BASE = new Date('2026-08-10T09:00:00.000Z').getTime()
const seedTime = (minutesAgo: number) => new Date(SEED_BASE - minutesAgo * 60_000).toISOString()

export function mockWorkers(): Worker[] {
  return [
    {
      id: 'wk-embed',
      name: 'embed',
      runtime: 'python',
      size: '4x2',
      access: 'public',
      instances: 2,
      region: WORKERS_REGION,
      state: 'active',
      createdAt: seedTime(60 * 26),
      updatedAt: seedTime(42),
      events: [
        { id: 'ev-embed-1', at: seedTime(60 * 26), level: 'info', message: 'Deploy started' },
        {
          id: 'ev-embed-2',
          at: seedTime(60 * 26 - 1),
          level: 'info',
          message: 'Built image python:3.14-slim',
        },
        {
          id: 'ev-embed-3',
          at: seedTime(60 * 26 - 1),
          level: 'info',
          message: 'Worker active on 2 instances',
        },
      ],
    },
    {
      id: 'wk-resize-images',
      name: 'resize-images',
      runtime: 'node',
      size: '2x1',
      access: 'private',
      instances: 1,
      region: WORKERS_REGION,
      state: 'active',
      createdAt: seedTime(60 * 8),
      updatedAt: seedTime(15),
      events: [
        { id: 'ev-resize-1', at: seedTime(60 * 8), level: 'info', message: 'Deploy started' },
        {
          id: 'ev-resize-2',
          at: seedTime(60 * 8 - 1),
          level: 'info',
          message: 'Worker active on 1 instance',
        },
      ],
    },
    {
      id: 'wk-nightly-report',
      name: 'nightly-report',
      runtime: 'deno',
      size: '2x1',
      access: 'private',
      instances: 1,
      region: WORKERS_REGION,
      state: 'suspended',
      createdAt: seedTime(60 * 72),
      updatedAt: seedTime(60 * 5),
      events: [
        {
          id: 'ev-nightly-1',
          at: seedTime(60 * 5),
          level: 'info',
          message: 'Suspended after idle timeout',
        },
      ],
    },
  ]
}
