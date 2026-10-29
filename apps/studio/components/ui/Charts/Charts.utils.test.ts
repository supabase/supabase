import { describe, expect, it } from 'vitest'

import { computeYAxisDomain, normalizeStackedSeriesData } from './Charts.utils'

const IOPS_DATA = [
  { timestamp: 1, disk_iops_write: 40, disk_iops_read: 80, disk_iops_max: 100 },
  { timestamp: 2, disk_iops_write: 10, disk_iops_read: 20, disk_iops_max: 100 },
  { timestamp: 3, disk_iops_write: 5, disk_iops_read: 5, disk_iops_max: 100 },
]

const IOPS_VISIBLE = ['disk_iops_write', 'disk_iops_read']

describe('computeYAxisDomain', () => {
  describe('memory commitment axis', () => {
    const GIB = 1024 ** 3
    const memoryBelowCapacity = {
      isPercentage: false,
      showMaxValue: false,
      yMaxFromVisible: 2 * GIB,
      thresholdZoneMax: 8 * GIB,
      maxAttributeKey: undefined,
      showMaxLine: false,
      data: [{ ram_commit_used: 2 * GIB }],
      visibleAttributeNames: ['ram_commit_used'],
    }

    it('shows commitment against full capacity so low usage does not appear near the limit', () => {
      expect(computeYAxisDomain(memoryBelowCapacity)).toEqual([0, 8 * GIB])
    })

    it('keeps the capacity scale when Committed is hidden', () => {
      expect(computeYAxisDomain({ ...memoryBelowCapacity, visibleAttributeNames: [] })).toEqual([
        0,
        8 * GIB,
      ])
    })

    it('keeps above-capacity commitment visible', () => {
      expect(
        computeYAxisDomain({
          ...memoryBelowCapacity,
          data: [{ ram_commit_used: 10 * GIB }],
          visibleAttributeNames: ['ram_commit_used'],
        })
      ).toEqual([0, 10 * GIB])
    })
  })

  describe('CPU percentage axis with the maximum hidden', () => {
    it('scales from zero to the observed 75% instead of the 100% limit', () => {
      expect(
        computeYAxisDomain({
          isPercentage: true,
          showMaxValue: false,
          yMaxFromVisible: 75,
          maxAttributeKey: 'cpu_usage_max',
          showMaxLine: false,
          data: [{ cpu_busy: 75, cpu_usage_max: 100 }],
          visibleAttributeNames: ['cpu_busy'],
        })
      ).toEqual([0, 75])
    })

    it('keeps the observed 60% scale even when the maximum series exists', () => {
      expect(
        computeYAxisDomain({
          isPercentage: true,
          showMaxValue: false,
          yMaxFromVisible: 60,
          maxAttributeKey: 'cpu_usage_max',
          showMaxLine: true,
          data: [{ cpu_busy: 60, cpu_usage_max: 100 }],
          visibleAttributeNames: ['cpu_busy'],
        })
      ).toEqual([0, 60])
    })
  })

  describe('disk operations without a visible limit', () => {
    it('uses automatic scaling when no limit metric is configured', () => {
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: false,
          yMaxFromVisible: 80,
          maxAttributeKey: undefined,
          showMaxLine: false,
          data: IOPS_DATA,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual(['auto', 'auto'])
    })

    it('uses automatic scaling when the limit line is hidden', () => {
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 80,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: false,
          data: IOPS_DATA,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual(['auto', 'auto'])
    })
  })

  describe('disk operations before the limit loads', () => {
    it('uses automatic scaling while the limit is zero', () => {
      const dataWithZeroMax = IOPS_DATA.map((p) => ({ ...p, disk_iops_max: 0 }))
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 80,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: dataWithZeroMax,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual(['auto', 'auto'])
    })
  })

  describe('charts with a visible limit', () => {
    it('shows the 100-operation limit when stacked reads and writes stay below it', () => {
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 40,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: [
            { disk_iops_write: 30, disk_iops_read: 40, disk_iops_max: 100 },
            { disk_iops_write: 20, disk_iops_read: 30, disk_iops_max: 100 },
          ],
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual([0, 100])
    })

    it('expands to 120 operations when 40 writes plus 80 reads exceed the 100-operation limit', () => {
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 80,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data: IOPS_DATA,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual([0, 120])
    })

    it('shows the 60-connection limit when one connection series peaks at 52', () => {
      const data = [
        { pg_stat_database_num_backends: 45, max_db_connections: 60 },
        { pg_stat_database_num_backends: 52, max_db_connections: 60 },
      ]
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 52,
          maxAttributeKey: 'max_db_connections',
          showMaxLine: true,
          data,
          visibleAttributeNames: ['pg_stat_database_num_backends'],
        })
      ).toEqual([0, 60])
    })

    it('ignores missing or invalid reads and writes without losing the limit', () => {
      const data = [
        { disk_iops_write: 'bad', disk_iops_read: null, disk_iops_max: 100 },
        { disk_iops_max: 100 },
        { disk_iops_write: 20, disk_iops_read: 30, disk_iops_max: 100 },
      ]
      expect(
        computeYAxisDomain({
          isPercentage: false,
          showMaxValue: true,
          yMaxFromVisible: 30,
          maxAttributeKey: 'disk_iops_max',
          showMaxLine: true,
          data,
          visibleAttributeNames: IOPS_VISIBLE,
        })
      ).toEqual([0, 100])
    })
  })
})

describe('normalizeStackedSeriesData', () => {
  it('shows fractional CPU shares accurately', () => {
    const normalized = normalizeStackedSeriesData({
      data: [{ system: 1, user: 1, idle: 4 }],
      attributeNames: ['system', 'user', 'idle'],
    })

    expect(normalized[0].system).toBeCloseTo(100 / 6)
    expect(normalized[0].user).toBeCloseTo(100 / 6)
    expect(normalized[0].idle).toBeCloseTo(400 / 6)
  })

  it('keeps zero CPU usage at zero', () => {
    const empty = [{ system: 0, user: 0, idle: 0 }]

    expect(
      normalizeStackedSeriesData({
        data: empty,
        attributeNames: ['system', 'user', 'idle'],
      })
    ).toEqual(empty)
  })

  it('leaves unselected series unchanged', () => {
    const data = [{ system: 50, user: 30, timestamp: 1000 }]

    expect(
      normalizeStackedSeriesData({
        data,
        attributeNames: [],
      })
    ).toEqual(data)
  })

  it('keeps normalized CPU history at its original timestamps', () => {
    const data = [{ system: 60, user: 80, period_start: '2024-01-01', timestamp: 1000 }]
    const normalized = normalizeStackedSeriesData({
      data,
      attributeNames: ['system', 'user'],
    })

    expect(normalized[0].period_start).toBe('2024-01-01')
    expect(normalized[0].timestamp).toBe(1000)
    expect(Number(normalized[0].system) + Number(normalized[0].user)).toBeCloseTo(100)
  })
})
