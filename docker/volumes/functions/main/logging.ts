type LogRecord = {
  stream: 'request' | 'runtime' | 'internal'
  msg: string
  metadata: object
  timestamp?: string
}

export function emitLog({ stream, msg, metadata, timestamp = new Date().toISOString() }: LogRecord): void {
  console.log(JSON.stringify({
    schema: 'supabase.edge.logs.v1',
    stream,
    timestamp,
    msg,
    metadata,
  }))
}

export function logInternal(
  component: 'main' | 'event-worker',
  level: 'info' | 'warning' | 'error',
  msg: string,
  error?: unknown,
): void {
  emitLog({
    stream: 'internal',
    msg,
    metadata: {
      component,
      level,
      ...(error !== undefined && {
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
      }),
    },
  })
}
