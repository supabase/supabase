export const projectEventsKeys = {
  list: (
    ref?: string,
    startDate?: string,
    endDate?: string,
    eventTypes?: string[],
    limit?: number
  ) => ['projects', ref, 'events', startDate, endDate, eventTypes, limit] as const,
}
