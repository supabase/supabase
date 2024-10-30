import { vi } from 'vitest'

export const useStorageReport = vi.fn().mockReturnValue({
  data: {
    cacheHitRate: [
      { hit_count: 15, miss_count: 0, timestamp: 1715230800000000 },
      { hit_count: 1542, miss_count: 15, timestamp: 1715227200000000 },
    ],
    topCacheMisses: [
      {
        count: 3,
        path: '/storage/v1/object/public/videos/docs/guides/edge-functions-inference.mp4',
      },
      { count: 2, path: '/storage/v1/object/public/videos/marketing/tabTableEditor.mp4' },
    ],
  },
  params: {
    cacheHitRate: {
      iso_timestamp_start: '2024-05-09T03:00:00.000Z',
      project: 'default',
      sql: '',
    },
    topCacheMisses: {
      iso_timestamp_start: '2024-05-09T03:00:00.000Z',
      project: 'default',
      sql: '',
    },
  },
  filters: [],
  isLoading: false,
  mergeParams: vi.fn(),
  refresh: vi.fn(),
})
