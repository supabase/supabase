import { useFlag } from 'common'

import { LOG_DRAIN_TYPES } from './LogDrains.constants'

export function useEnabledLogDrainTypes() {
  const syslogEnabled = useFlag('syslogLogDrain')

  return LOG_DRAIN_TYPES.filter((t) => {
    if (t.value === 'syslog') return syslogEnabled
    return true
  })
}
