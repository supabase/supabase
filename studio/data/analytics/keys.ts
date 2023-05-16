import { LogsEndpointParams } from 'components/interfaces/Settings/Logs'

export const analyticsKeys = {
  functionsInvStats: (
    projectRef: string | undefined,
    { interval, functionId }: { functionId: string | undefined; interval: string | undefined }
  ) => ['projects', projectRef, 'functions-inv-stats', { interval, functionId }] as const,
  dailyStats: (
    projectRef: string | undefined,
    {
      attribute,
      startDate,
      endDate,
      interval,
    }: { attribute?: string; startDate?: string; endDate?: string; interval?: string }
  ) =>
    ['projects', projectRef, 'daily-stats', { attribute, startDate, endDate, interval }] as const,
  infraMonitoring: (
    projectRef: string | undefined,
    {
      attribute,
      startDate,
      endDate,
      interval,
    }: { attribute?: string; startDate?: string; endDate?: string; interval?: string }
  ) =>
    [
      'projects',
      projectRef,
      'infra-monitoring',
      { attribute, startDate, endDate, interval },
    ] as const,
}
