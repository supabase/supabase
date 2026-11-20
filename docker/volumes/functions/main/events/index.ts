import { emitLog, logInternal } from '../logging.ts'

// Event-worker protocol from supabase/edge-runtime (ext/event_worker/events.rs).
// The runtime supplies EventManager but does not publish ambient types for it.
type EventPayloads = {
  Boot: { boot_time: number }
  BootFailure: { msg: string }
  UncaughtException: { exception: string; cpu_time_used: number }
  Shutdown: { reason: string; cpu_time_used: number; memory_used: { total: number; heap: number; external: number } }
  Log: { msg: string; level: 'Debug' | 'Info' | 'Warning' | 'Error' }
}
type WorkerEvent = {
  [K in keyof EventPayloads]: {
    event_type: K
    event: EventPayloads[K]
    timestamp: string
    metadata?: { service_path?: string | null; execution_id?: string | null } | null
  }
}[keyof EventPayloads]
declare class EventManager {
  [Symbol.asyncIterator](): AsyncIterator<WorkerEvent | undefined>
}

const MAX_MESSAGE_LENGTH = 10_000
const MAX_LOGS_PER_FUNCTION_PER_WINDOW = 100
const THROTTLE_WINDOW_MS = 1_000

// Strip terminal CSI sequences (including colors) and OSC sequences (including links).
// deno-lint-ignore no-control-regex
const ANSI_PATTERN = /(?:\x1b\](?:[^\x07\x1b]|\x1b(?!\\))*(?:\x07|\x1b\\))|(?:(?:\x1b\[|\x9b)[0-?]*[ -/]*[@-~])/g

function sanitize(msg: string): string {
  const message = msg.replace(ANSI_PATTERN, '').slice(0, MAX_MESSAGE_LENGTH)
  // Do not emit an unmatched surrogate when truncating an astral character.
  return message.replace(/[\uD800-\uDBFF]$/, '')
}

function emit(msg: string, metadata: object, timestamp = new Date().toISOString()): void {
  emitLog({ stream: 'runtime', timestamp, msg: sanitize(msg), metadata })
}

interface ThrottleState {
  count: number
  dropped: number
}

const throttleState = new Map<string, ThrottleState>()

function allowLog(fn: string): boolean {
  let state = throttleState.get(fn)
  if (!state) {
    state = { count: 0, dropped: 0 }
    throttleState.set(fn, state)
    // A fixed window starting with this function's first log. The timer reports
    // drops without waiting for another event and releases inactive entries.
    setTimeout(() => {
      const completed = throttleState.get(fn)
      throttleState.delete(fn)
      if (!completed?.dropped) return
      try {
        emit(`${completed.dropped} log event(s) dropped due to throttling`, {
          function_id: fn,
          event_type: 'Log',
          level: 'warning',
          dropped_count: completed.dropped,
          synthetic: true,
        })
      } catch (error) {
        logInternal('event-worker', 'error', 'event worker failed to report dropped logs', error)
      }
    }, THROTTLE_WINDOW_MS)
  }
  if (state.count >= MAX_LOGS_PER_FUNCTION_PER_WINDOW) {
    state.dropped++
    return false
  }
  state.count++
  return true
}

function extractFunctionName(servicePath?: string | null): string {
  return servicePath?.split('/').filter(Boolean).pop() || 'unknown'
}

// EventManager is supplied by Edge Runtime only in an event worker.
for await (const ev of new EventManager()) {
  if (!ev) continue
  try {
    const fn = extractFunctionName(ev.metadata?.service_path)
    const base = {
      function_id: fn,
      execution_id: ev.metadata?.execution_id,
      event_type: ev.event_type,
    }
    switch (ev.event_type) {
      case 'Boot':
        emit(`booted (time: ${ev.event.boot_time}ms)`, {
          ...base, level: 'info', boot_time: ev.event.boot_time,
        }, ev.timestamp)
        break
      case 'BootFailure':
        emit(ev.event.msg, { ...base, level: 'error' }, ev.timestamp)
        break
      case 'UncaughtException':
        emit(ev.event.exception, {
          ...base, level: 'error', cpu_time_used: ev.event.cpu_time_used,
        }, ev.timestamp)
        break
      case 'Shutdown': {
        const { reason, cpu_time_used, memory_used } = ev.event
        const level = reason === 'CPUTime' || reason === 'Memory' ? 'error' : 'info'
        emit(`shutdown (${reason})`, {
          ...base, level, reason, cpu_time_used, memory_used,
        }, ev.timestamp)
        break
      }
      case 'Log':
        if (allowLog(fn)) {
          emit(ev.event.msg, {
            ...base, level: String(ev.event.level ?? 'Info').toLowerCase(),
          }, ev.timestamp)
        }
        break
    }
  } catch (error) {
    logInternal('event-worker', 'error', 'event worker failed to process event', error)
  }
}

export {}
