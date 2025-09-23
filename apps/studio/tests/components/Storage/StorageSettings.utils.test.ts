import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { describe, test, expect } from 'vitest'

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
