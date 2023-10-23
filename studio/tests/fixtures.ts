import { LogData } from 'components/interfaces/Settings/Logs'

export const logDataFixture = (attrs: Partial<LogData>): LogData => ({
  id: `some-uuid-${new Date().getTime()}`,
  timestamp: new Date().getTime() * 1000,
  event_message: 'first event',
  ...attrs,
})
