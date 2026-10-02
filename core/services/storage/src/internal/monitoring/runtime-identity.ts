import { getGlobal } from '@platformatic/globals'
import * as os from 'os'

function normalizeIdentityPart(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}`
  if (typeof value !== 'string') return

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function resolveRuntimeIdentity() {
  const platformatic = getGlobal()
  const applicationId = normalizeIdentityPart(platformatic?.applicationId)
  const workerId = normalizeIdentityPart(platformatic?.workerId)
  const hostname = os.hostname()
  const runtimeId = workerId === undefined ? `pid:${process.pid}` : `worker:${workerId}`

  return {
    hostname,
    serviceInstanceId: [hostname, applicationId, runtimeId].filter(Boolean).join(':'),
    applicationId,
    workerId,
  }
}
