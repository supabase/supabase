import {
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
} from './DiskManagement.utils'
import { DiskType } from './DiskManagement.constants'

describe('DiskManagement.utils.ts:calculateDiskSizePrice', () => {
  test('GP3 with 8GB to GP3 with 10GB for pro plan', () => {
    const result = calculateDiskSizePrice({
      planId: 'pro',
      oldSize: 8,
      oldStorageType: DiskType.GP3,
      newSize: 10,
      newStorageType: DiskType.GP3,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('0.25')
  })
  test('IO2 with 8GB to IO2 with 10GB for pro plan', () => {
    const result = calculateDiskSizePrice({
      planId: 'pro',
      oldSize: 8,
      oldStorageType: DiskType.IO2,
      newSize: 10,
      newStorageType: DiskType.IO2,
    })
    expect(result.oldPrice).toBe('1.56')
    expect(result.newPrice).toBe('1.95')
  })
  test('GP3 with 8GB to GP3 with 10GB, with 2 replicas', () => {
    const result = calculateDiskSizePrice({
      planId: 'pro',
      oldSize: 8,
      oldStorageType: DiskType.GP3,
      newSize: 10,
      newStorageType: DiskType.GP3,
      numReplicas: 2,
    })
    expect(result.oldPrice).toBe('2.50')
    expect(result.newPrice).toBe('3.38')
  })
})

describe('DiskManagement.utils.ts:calculateIOPSPrice', () => {
  test('GP3 with 3000 to IO2 with 3000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.IO2,
      newProvisionedIOPS: 3000,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('357.00')
  })
  test('GP3 with 3000 to GP3 with 5000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.GP3,
      newProvisionedIOPS: 5000,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('48.00')
  })
  test('IO2 with 3000 to IO2 with 5000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.IO2,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.IO2,
      newProvisionedIOPS: 5000,
    })
    expect(result.oldPrice).toBe('357.00')
    expect(result.newPrice).toBe('595.00')
  })
})

describe('DiskManagement.utils.ts:calculateThroughputPrice', () => {
  test('GP3 with 125 MB/s 150 MB/s', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.GP3,
      oldThroughput: 125,
      newThroughput: 150,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('2.38')
  })
  test('IO1 with 125 MB/s 150 MB/s', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.IO2,
      oldThroughput: 125,
      newThroughput: 150,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('0.00')
  })
})
