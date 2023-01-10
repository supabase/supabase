import { LogsEndpointParams } from 'components/interfaces/Settings/Logs'

export const analyticsKeys = {
  logs: (projectRef: string | undefined, params: LogsEndpointParams) =>
    ['projects', projectRef, 'logs', params] as const,
  log: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'log', id] as const,
  functionsInvStats: (
    projectRef: string | undefined,
    { interval, functionId }: { functionId: string | undefined; interval: string | undefined }
  ) => ['projects', projectRef, 'functions-inv-stats', { interval, functionId }] as const,
}
