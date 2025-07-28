export const realtimeKeys = {
  configuration: (projectRef: string | undefined) =>
    ['projects', projectRef, 'realtime', 'configuration'] as const,
}
