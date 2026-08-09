import crypto from 'node:crypto'
import fs, { type FileHandle } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(os.tmpdir(), 'playwright-locks')

const sha1 = (str: string) => crypto.createHash('sha1').update(str).digest('hex')
const uniqueWorkerId = () => {
  const workerIndex = process.env.TEST_WORKER_INDEX
  const hostname = os.hostname()
  const pid = process.pid
  const uniquePart = crypto.randomBytes(4).toString('hex')

  return `${hostname}-${pid}-${workerIndex}-${uniquePart}`
}

const keyFromModuleUrl = (moduleUrl: string) => {
  const absPath = fileURLToPath(moduleUrl)
  const key = sha1(absPath)
  const dir = path.join(ROOT, key.slice(0, 2), key.slice(2))
  return { absPath, key, dir }
}

const exists = async (path: string) => {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

const getCodeFromUnknownError = (err: unknown): string | undefined => {
  if (err && typeof err === 'object' && 'code' in err) {
    return String(err.code)
  }
}

export const withFileOnceSetup = async (
  currentModuleUrl: string,
  fn: () => Promise<void>,
  { timeoutMs = 120_000 } = {}
): Promise<void> => {
  const { absPath, dir } = keyFromModuleUrl(currentModuleUrl)
  const lockfile = path.join(dir, `setup.lock`)
  const doneFile = path.join(dir, `setup.done.json`)
  const leasesDir = path.join(dir, `leases`)
  const leaseId = uniqueWorkerId()
  const myLease = path.join(leasesDir, leaseId)

  await fs.mkdir(leasesDir, { recursive: true })

  // Acquire a lease for this worker on this test file
  await fs.writeFile(myLease, '')

  // Fast path: another worker already finished setup
  if (await exists(doneFile)) {
    return
  }

  // Try to acquire the setup lock
  let fd: FileHandle | null = null
  try {
    fd = await fs.open(lockfile, 'wx')
  } catch (err: unknown) {
    if (getCodeFromUnknownError(err) !== 'EEXIST') {
      // Drop lease and bail
      try {
        await fs.unlink(myLease)
      } catch {}
      throw err
    }

    // Another worker is doing setup, wait for done
    const start = Date.now()
    const baseSleepMs = 500
    const incrementMs = 100
    let attempt = 0

    while (!(await exists(doneFile))) {
      if (Date.now() - start > timeoutMs) {
        // Drop lease and bail
        try {
          await fs.unlink(myLease)
        } catch {}
        throw new Error(`Timed out waiting for once-per-file setup in ${absPath}`)
      }

      const jitter = (Math.random() - 0.5) * 100
      const sleep = baseSleepMs + incrementMs * Math.pow(2, attempt++) + jitter
      await new Promise((resolve) => setTimeout(resolve, sleep))
    }
  }

  // We have the lock, perform setup and mark done
  try {
    if (!(await exists(doneFile))) {
      await fn()
      await fs.writeFile(
        doneFile,
        JSON.stringify({ at: new Date().toISOString(), file: absPath, pid: process.pid }, null, 2)
      )
    }
  } finally {
    try {
      await fd?.close()
    } catch {}
    try {
      await fs.unlink(lockfile)
    } catch {}
  }
}

export const releaseFileOnceCleanup = async (currentModuleUrl: string): Promise<void> => {
  const { dir } = keyFromModuleUrl(currentModuleUrl)
  const leasesDir = path.join(dir, `leases`)
  const doneFile = path.join(dir, `setup.done.json`)
  const cleanupLock = path.join(dir, `cleanup.lock`)

  // Remove all leases associated with this worker
  try {
    const entries = await fs.readdir(leasesDir)
    await Promise.all(
      entries.map(async (name) => {
        if (name.includes(`-${process.pid}-`)) {
          try {
            await fs.unlink(path.join(leasesDir, name))
          } catch {}
        }
      })
    )
  } catch {}

  // Try to acquire cleanup lock
  let fd: FileHandle | null = null
  try {
    await fs.mkdir(dir, { recursive: true })
    fd = await fs.open(cleanupLock, 'wx')
  } catch {
    // Another worker is cleaning up; we're done
    return
  }

  try {
    // Only delete if no leases remain
    let remaining = 0
    try {
      const entries = await fs.readdir(leasesDir)
      remaining = entries.length
    } catch {}

    if (remaining === 0) {
      // Remove done marker and empty directories
      try {
        await fs.unlink(doneFile)
      } catch {}
      try {
        await fs.rmdir(leasesDir)
      } catch {}
      // Attempt to remove the key directory if empty
      try {
        await fs.rmdir(dir)
      } catch {}
    }
  } finally {
    try {
      await fd?.close()
    } catch {}
    try {
      await fs.unlink(cleanupLock)
    } catch {}
  }
}
