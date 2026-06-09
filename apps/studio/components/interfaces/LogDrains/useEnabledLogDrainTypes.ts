import { useFlag } from 'common'

import { LOG_DRAIN_TYPES } from './LogDrains.constants'

export function useEnabledLogDrainTypes() {
  const sentryEnabled = useFlag('SentryLogDrain')
  const s3Enabled = useFlag('S3logdrain')
  const axiomEnabled = useFlag('axiomLogDrain')
  const otlpEnabled = useFlag('otlpLogDrain')
  const last9Enabled = useFlag('Last9LogDrain')
  const syslogEnabled = useFlag('syslogLogDrain')

  return LOG_DRAIN_TYPES.filter((t) => {
    if (t.value === 'sentry') return sentryEnabled
    if (t.value === 's3') return s3Enabled
    if (t.value === 'axiom') return axiomEnabled
    if (t.value === 'otlp') return otlpEnabled
    if (t.value === 'last9') return last9Enabled
    if (t.value === 'syslog') return syslogEnabled
    return true
  })
}
