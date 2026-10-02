import { ERRORS, ErrorCode, StorageBackendError } from '@internal/errors'

export interface ByteRange {
  fromByte: number
  size: number
  toByte: number
}

export function parseRangeHeader(range: string, fileSize: number): ByteRange {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  if (!match || fileSize <= 0) {
    throw invalidRangeHeaderError()
  }

  const [, startValue, endValue] = match
  if (!startValue && !endValue) {
    throw invalidRangeHeaderError()
  }

  if (!startValue) {
    const suffixLength = Number(endValue)
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      throw invalidRangeHeaderError()
    }

    const fromByte = Math.max(fileSize - suffixLength, 0)
    const toByte = fileSize - 1
    return {
      fromByte,
      size: toByte - fromByte + 1,
      toByte,
    }
  }

  const fromByte = Number(startValue)
  const toByte = endValue ? Number(endValue) : fileSize - 1
  if (!isValidRange(fromByte, toByte, fileSize)) {
    throw invalidRangeHeaderError()
  }

  const clampedToByte = Math.min(toByte, fileSize - 1)
  return {
    fromByte,
    size: clampedToByte - fromByte + 1,
    toByte: clampedToByte,
  }
}

function invalidRangeHeaderError() {
  return StorageBackendError.withStatusCode(416, {
    error: 'invalid_range',
    code: ErrorCode.InvalidRange,
    httpStatusCode: 416,
    message: 'invalid range provided',
  })
}

export function parseCopySourceRangeHeader(range: string, sourceSize: number): ByteRange {
  const match = /^bytes=(\d+)-(\d+)$/.exec(range)
  if (!match) {
    throw ERRORS.InvalidRange()
  }

  const [, startValue, endValue] = match
  const fromByte = Number(startValue)
  const toByte = Number(endValue)

  if (!isValidRange(fromByte, toByte, sourceSize) || toByte >= sourceSize) {
    throw ERRORS.InvalidRange()
  }

  return {
    fromByte,
    size: toByte - fromByte + 1,
    toByte,
  }
}

function isValidRange(fromByte: number, toByte: number, objectSize: number): boolean {
  return (
    Number.isSafeInteger(fromByte) &&
    Number.isSafeInteger(toByte) &&
    fromByte >= 0 &&
    toByte >= fromByte &&
    fromByte < objectSize
  )
}
