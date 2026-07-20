import { safeSql } from '@supabase/pg-meta'
import { describe, expect, it, vi } from 'vitest'

import { executeWithRetry } from './table-rows-query'
import { wrapWithWarehouseSnapshotTime } from './warehouse-time-travel'

describe('executeWithRetry', () => {
  it('should return the result of the function when successful', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const result = await executeWithRetry(mockFn)
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on 429 errors with exponential backoff', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429, headers: { get: () => '1' } })
      .mockRejectedValueOnce({ status: 429, headers: { get: () => '1' } })
      .mockResolvedValue('success')

    const result = await executeWithRetry(mockFn)
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should throw error after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue({ status: 429, headers: { get: () => '1' } })

    await expect(executeWithRetry(mockFn, 2)).rejects.toMatchObject({ status: 429 })
    expect(mockFn).toHaveBeenCalledTimes(3) // Initial attempt + 2 retries
  })

  it('should throw non-429 errors immediately', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Some other error'))

    await expect(executeWithRetry(mockFn)).rejects.toThrow('Some other error')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('wrapWithWarehouseSnapshotTime', () => {
  it('adds the warehouse snapshot setting for warehouse schemas', () => {
    const sql = safeSql`select * from public_warehouse.orders`
    const result = wrapWithWarehouseSnapshotTime({
      schema: 'public_warehouse',
      snapshotTime: '2026-06-24T08:00:00.000Z',
      sql,
    })

    expect(result).toContain("SET LOCAL warehouse.snapshot_time = '2026-06-24T08:00:00.000Z'")
    expect(result).toContain(sql)
  })

  it('does not wrap non-warehouse schemas', () => {
    const sql = safeSql`select * from public.orders`
    const result = wrapWithWarehouseSnapshotTime({
      schema: 'public',
      snapshotTime: '2026-06-24T08:00:00.000Z',
      sql,
    })

    expect(result).toBe(sql)
  })
})
