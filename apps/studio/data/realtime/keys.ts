export const realtimeKeys = {
  channels: (projectRef: string | undefined) => ['projects', projectRef, 'channels'] as const,
}
