const CHECK_INTERVAL_MS = 1_000
const PRESSURE_THRESHOLD = 0.8
const CLEANUP_TIMEOUT_MS = 1_000
const RETRY_INTERVAL_MS = 5_000

function parseBytes(value: string, minimum: number): number {
  const bytes = Number(value)
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(bytes) || bytes < minimum) {
    throw new Error('Invalid cgroup memory value')
  }
  return bytes
}

export function startMemoryPressureLoop(): void {
  let errorReported = false
  let activeReported = false

  const tick = async () => {
    let delay = CHECK_INTERVAL_MS
    try {
      const max = (await Deno.readTextFile('/sys/fs/cgroup/memory.max')).trim()
      if (max === 'max') {
        console.warn('Memory pressure monitor disabled: a finite memory limit is required')
        return
      }
      const current = (await Deno.readTextFile('/sys/fs/cgroup/memory.current')).trim()
      const stat = await Deno.readTextFile('/sys/fs/cgroup/memory.stat')
      const limitBytes = parseBytes(max, 1)
      const currentBytes = parseBytes(current, 0)
      const inactiveFileBytes = parseBytes(stat.match(/^inactive_file[ \t]+(\S+)[ \t]*$/m)?.[1] ?? '', 0)
      // Exclude inactive file cache that the kernel can reclaim under pressure.
      const workingSetBytes = Math.max(0, currentBytes - inactiveFileBytes)
      // Logged once so operators (and test-container-logs.sh) can confirm monitoring is on.
      if (!activeReported) {
        console.log(`Memory pressure monitor active (limit ${limitBytes} bytes)`)
        activeReported = true
      }

      if (workingSetBytes / limitBytes >= PRESSURE_THRESHOLD) {
        delay = RETRY_INTERVAL_MS
        const acknowledged = await EdgeRuntime.userWorkers.tryCleanupIdleWorkers(CLEANUP_TIMEOUT_MS)
        EdgeRuntime.miCollect()
        if (acknowledged > 0) {
          console.warn(
            `Memory pressure: working set ${workingSetBytes} / ${limitBytes} bytes before cleanup; ` +
              `${acknowledged} worker(s) acknowledged retirement`
          )
        }
      }
      errorReported = false
    } catch (error) {
      if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.PermissionDenied) {
        console.warn(`Memory pressure monitor disabled: ${error}`)
        return
      }
      delay = RETRY_INTERVAL_MS
      if (!errorReported) {
        console.warn(`Memory pressure monitor failed; retrying: ${error}`)
        errorReported = true
      }
    }
    // Schedule only after this cycle finishes: no overlapping work or queued ticks.
    setTimeout(() => void tick(), delay)
  }

  setTimeout(() => void tick(), CHECK_INTERVAL_MS)
}
