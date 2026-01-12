import { status } from 'http-status'

export function getHttpStatusCodeInfo(codeNumber: number): {
  code: number
  name: string
  message: string
  label: string
} {
  type StatusCodeKey = keyof typeof status

  if (!(codeNumber in status)) {
    return {
      code: codeNumber,
      name: 'UNKNOWN',
      message: 'Unknown status code',
      label: 'Unknown',
    }
  }

  const statusCodeLabel = status[codeNumber as StatusCodeKey]
  const statusCodeMessage = status[`${codeNumber}_MESSAGE` as StatusCodeKey]
  const statusCodeName = status[`${codeNumber}_NAME` as StatusCodeKey]

  return {
    code: codeNumber,
    name: statusCodeName as string,
    label: statusCodeLabel as string,
    message: statusCodeMessage as string,
  }
}
