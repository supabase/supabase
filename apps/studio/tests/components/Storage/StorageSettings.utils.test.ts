import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  BUCKET_LIMIT_ERROR_PREFIX,
  convertFromBytes,
  convertToBytes,
  decodeBucketLimitErrorMessage,
  encodeBucketLimitErrorMessage,
  isBucketLimitErrorMessage,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { describe, expect, test } from 'vitest'

describe('StorageSettings.utils: convertFromBytes', () => {
  test('should convert 1024 to 1KB', () => {
    const mockInput = 1024
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 1, unit: StorageSizeUnits.KB })
  })
  test('should convert 5242880 to 50MB', () => {
    const mockInput = 52428800
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 50, unit: StorageSizeUnits.MB })
  })
  test('should convert 100 to 100 bytes', () => {
    const mockInput = 100
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 100, unit: StorageSizeUnits.BYTES })
  })
  test('should convert 5712306503.68 to 5.32GB', () => {
    const mockInput = 5712306503.68
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 5.32, unit: StorageSizeUnits.GB })
  })
  test('should convert 9123162431 to 8.496607123874128GB', () => {
    const mockInput = 9123162431
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 8.496607123874128, unit: StorageSizeUnits.GB })
  })
  test('should convert negative inputs to just 0', () => {
    const mockInput = -1000
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 0, unit: StorageSizeUnits.BYTES })
  })
  test('should convert up to GB', () => {
    const mockInput = 10737418240000
    const output = convertFromBytes(mockInput)
    expect(output).toStrictEqual({ value: 10000, unit: StorageSizeUnits.GB })
  })
  test('should be able to convert given input into specific output unit', () => {
    const mockInput1 = 5368709120
    const output1 = convertFromBytes(mockInput1, StorageSizeUnits.GB)
    expect(output1).toStrictEqual({ value: 5, unit: StorageSizeUnits.GB })

    const mockInput2 = 5368709120
    const output2 = convertFromBytes(mockInput2, StorageSizeUnits.MB)
    expect(output2).toStrictEqual({ value: 5120, unit: StorageSizeUnits.MB })

    const mockInput3 = 5368709120
    const output3 = convertFromBytes(mockInput3, StorageSizeUnits.KB)
    expect(output3).toStrictEqual({ value: 5242880, unit: StorageSizeUnits.KB })
  })
})

describe('StorageSettings.utils: convertToBytes', () => {
  test('should be able to convert to bytes', () => {
    const mockInput = 100
    const output = convertToBytes(mockInput)
    expect(output).toStrictEqual(100)
  })
  test('should be able to convert to KB', () => {
    const output = convertToBytes(10, StorageSizeUnits.KB)
    expect(output).toStrictEqual(10240)
  })
  test('should be able to convert to MB', () => {
    const output = convertToBytes(51.2, StorageSizeUnits.MB)
    expect(output).toStrictEqual(53687091.2)
  })
  test('should be able to convert to GB', () => {
    const output = convertToBytes(10.21, StorageSizeUnits.GB)
    expect(output).toStrictEqual(10962904023.04)
  })
  test('should be able to handle negative inputs', () => {
    const output = convertToBytes(-12312, StorageSizeUnits.KB)
    expect(output).toStrictEqual(0)
  })
})

describe('StorageSettings.utils: bucket limit error encoding', () => {
  const bucketLists = [
    {
      description: 'multiple buckets with standard limits',
      buckets: [
        { name: 'images', limit: 1024 },
        { name: 'avatars', limit: 2048 },
      ],
    },
    {
      description: 'single bucket with zero limit',
      buckets: [{ name: 'avatars', limit: 0 }],
    },
    {
      description: 'bucket names with spaces and punctuation and large limits',
      buckets: [
        { name: 'prod-images', limit: Number.MAX_SAFE_INTEGER },
        { name: 'logs archive', limit: 987654321 },
      ],
    },
    {
      description: 'empty bucket list',
      buckets: [],
    },
    {
      description: 'bucket name with pipe/comma character (edge case)',
      buckets: [
        { name: 'data|backup', limit: 4096 },
        { name: 'reports,2023', limit: 8192 },
      ],
    },
  ]

  bucketLists.forEach(({ description, buckets }) => {
    test(`should round trip encode/decode for ${description}`, () => {
      const encoded = encodeBucketLimitErrorMessage(buckets)
      expect(encoded.startsWith(BUCKET_LIMIT_ERROR_PREFIX)).toBe(true)
      expect(isBucketLimitErrorMessage(encoded)).toBe(true)

      const decoded = decodeBucketLimitErrorMessage(encoded)
      expect(decoded).toStrictEqual(buckets)
    })
  })

  test('should return empty results for non bucket limit errors', () => {
    expect(isBucketLimitErrorMessage('other:error')).toBe(false)
    expect(decodeBucketLimitErrorMessage('other:error')).toStrictEqual([])
  })
})
