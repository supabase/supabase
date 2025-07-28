import { describe, test, expect } from 'vitest'
import { formatEstimatedCount } from './Pagination.utils'

describe('formatEstimatedCount', () => {
  test('Should estimate thousands correctly (I)', () => {
    const output = formatEstimatedCount(1530)
    expect(output).toStrictEqual('1.5K')
  })
  test('Should estimate thousands correctly (II)', () => {
    const output = formatEstimatedCount(15310)
    expect(output).toStrictEqual('15.3K')
  })
  test('Should estimate thousands correctly (III)', () => {
    const output = formatEstimatedCount(153122)
    expect(output).toStrictEqual('153.1K')
  })
  test('Should estimate millions correctly (I)', () => {
    const output = formatEstimatedCount(1531021)
    expect(output).toStrictEqual('1.5M')
  })
  test('Should estimate millions correctly (II)', () => {
    const output = formatEstimatedCount(15310212)
    expect(output).toStrictEqual('15.3M')
  })
  test('Should estimate millions correctly (III)', () => {
    const output = formatEstimatedCount(153102121)
    expect(output).toStrictEqual('153.1M')
  })
  test('Should estimate billions correctly (I)', () => {
    const output = formatEstimatedCount(1531021211)
    expect(output).toStrictEqual('1.5B')
  })
  test('Should estimate billions correctly (II)', () => {
    const output = formatEstimatedCount(15310212112)
    expect(output).toStrictEqual('15.3B')
  })
  test('Should estimate billions correctly (III)', () => {
    const output = formatEstimatedCount(153102121123)
    expect(output).toStrictEqual('153.1B')
  })
  test('Should estimate trillions correctly (I)', () => {
    const output = formatEstimatedCount(1531021211232)
    expect(output).toStrictEqual('1.5T')
  })
  test('Should estimate trillions correctly (II) and max out at trillions', () => {
    const output = formatEstimatedCount(1531021211232222)
    expect(output).toStrictEqual('1531.0T')
  })
})
