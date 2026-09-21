export const queryInsightsKeys = {
  data: (
    projectRef: string | undefined,
    isoTimestampStart: string,
    isoTimestampEnd: string,
    useOtel: boolean
  ) =>
    [
      'projects',
      projectRef,
      'query-insights',
      isoTimestampStart,
      isoTimestampEnd,
      { otel: useOtel },
    ] as const,
}
