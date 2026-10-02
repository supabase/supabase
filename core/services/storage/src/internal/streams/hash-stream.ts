// HashSpillWritable.ts

import { createHash, randomUUID } from 'node:crypto'
import fs, { WriteStream } from 'node:fs'
import * as fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable, Writable, WritableOptions } from 'node:stream'
import { finished } from 'node:stream/promises'

export interface HashSpillWritableOptions {
  /** Max bytes to keep in memory before spilling to disk (required, > 0). */
  limitInMemoryBytes: number
  /** Hash algorithm (default: 'sha256'). */
  alg?: string
  /** Parent directory for temp dirs (default: os.tmpdir()). */
  tmpRoot?: string
  /** Writable options to pass to base class (rarely needed). */
  writableOptions?: WritableOptions
}

export interface ToReadableOptions {
  /**
   * If true and data spilled to disk, the spilled file/dir will be removed
   * after the **last** reader closes/ends.
   */
  autoCleanup?: boolean
}

/**
 * Writable that hashes all bytes and buffers in memory up to `limitBytes`.
 * On first overflow, it spills to a unique temp file and appends subsequent data there.
 * - Call `digestHex()` *after* 'finish' (e.g. after pipeline resolves).
 * - Get a fresh readable with `toReadable({ autoCleanup })`. If multiple readers
 *   are created, cleanup is deferred until the last one finishes.
 * - Call `cleanup()` to explicitly remove temp artifacts; it defers until readers close.
 */
export class HashSpillWritable extends Writable {
  private readonly limitBytes: number
  private readonly alg: string
  private readonly tmpRoot: string

  // Hashing
  private hash = createHash('sha256')

  // Memory buffer until first spill
  private chunks: Buffer[] | null = []
  private memSize = 0

  // Spill state
  private spilled = false
  private tmpDir: string | null = null
  private filePath: string | null = null
  private fileStream: WriteStream | null = null
  private ensureFilePromise: Promise<void> | null = null

  // Readers + cleanup
  private activeReaders = 0
  private cleanupPending = false
  private cleanupRunning: Promise<void> | null = null

  // Bookkeeping
  private totalBytes = 0
  private finishedFlag = false
  private digestValue: string | null = null

  constructor(opts: HashSpillWritableOptions) {
    super(opts?.writableOptions)
    if (!(opts?.limitInMemoryBytes > 0)) throw new Error('limitBytes must be a positive number')

    this.limitBytes = opts.limitInMemoryBytes
    this.alg = opts.alg ?? 'sha256'
    this.tmpRoot = opts.tmpRoot ?? os.tmpdir()

    this.hash = createHash(this.alg)

    this.on('error', () => {
      void this.cleanupAsync()
    })
    this.on('close', () => {
      if (this.fileStream && !this.fileStream.closed) {
        try {
          this.fileStream.destroy()
        } catch {}
      }
    })
  }

  // Writable implementation
  _write(chunk: Buffer, _enc: BufferEncoding, cb: (error?: Error | null) => void): void {
    try {
      this.hash.update(chunk)
      this.totalBytes += chunk.length

      if (!this.spilled) {
        if (this.memSize + chunk.length <= this.limitBytes) {
          this.chunks!.push(chunk)
          this.memSize += chunk.length
          cb()
          return
        }
        // Spill
        this.spilled = true
        this.spillToDiskAndWrite(chunk).then(() => cb(), cb)
      } else {
        this.writeToFile(chunk).then(() => cb(), cb)
      }
    } catch (err) {
      cb(err as Error)
    }
  }

  _final(cb: (error?: Error | null) => void): void {
    const finalize = async () => {
      if (this.spilled && this.fileStream) {
        await new Promise<void>((resolve, reject) => {
          this.fileStream!.end((err: Error) => (err ? reject(err) : resolve()))
        })
        await finished(this.fileStream).catch(() => {})
      }
      if (!this.finishedFlag) {
        this.digestValue = this.hash.digest('hex')
        this.finishedFlag = true
      }
    }
    finalize().then(() => cb(), cb)
  }

  // Public API

  digestHex(): string {
    if (!this.finishedFlag || !this.digestValue) {
      throw new Error('digestHex() called before stream finished')
    }
    return this.digestValue
  }

  size(): number {
    return this.totalBytes
  }

  toReadable(opts: ToReadableOptions = {}): Readable {
    const { autoCleanup = false } = opts

    if (this.spilled) {
      if (!this.filePath) throw new Error('Internal error: spilled but no filePath')

      const rs = fs.createReadStream(this.filePath)
      this.activeReaders++

      const done = () => {
        rs.removeListener('close', done)
        rs.removeListener('end', done)
        rs.removeListener('error', done)

        this.activeReaders = Math.max(0, this.activeReaders - 1)

        if (autoCleanup && this.activeReaders === 0) {
          this.cleanupPending = true
          void this.maybeCleanupSpill()
        }
      }

      rs.once('close', done)
      rs.once('end', done)
      rs.once('error', done)

      return rs
    }

    // In-memory: nothing to clean up
    const snapshot = this.chunks ?? []
    return Readable.from(snapshot)
  }

  /** Explicit cleanup (deferred if readers are still active). */
  async cleanup(): Promise<void> {
    this.cleanupPending = true
    await this.maybeCleanupSpill()
  }

  // Internals

  private async ensureFile(): Promise<void> {
    if (this.ensureFilePromise) return this.ensureFilePromise

    this.ensureFilePromise = (async () => {
      this.tmpDir = await fsp.mkdtemp(path.join(this.tmpRoot, 'hashspill-')) // unique directory
      const name = `${Date.now()}-${randomUUID()}.bin` // unique filename
      this.filePath = path.join(this.tmpDir, name)
      this.fileStream = fs.createWriteStream(this.filePath, { flags: 'wx' }) // fail if exists
    })()

    return this.ensureFilePromise
  }

  private writeToFile(buf: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      void this.ensureFile()
        .then(() => {
          const ok = this.fileStream!.write(buf)
          if (ok) {
            resolve()
            return
          }

          this.fileStream!.once('drain', resolve)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  private async spillToDiskAndWrite(nextChunk: Buffer): Promise<void> {
    await this.ensureFile()

    const prefix = Buffer.concat(this.chunks!, this.memSize)
    // Free memory
    this.chunks = null
    this.memSize = 0

    await this.writeToFile(prefix)
    await this.writeToFile(nextChunk)
  }

  private async maybeCleanupSpill(): Promise<void> {
    if (this.cleanupRunning) return this.cleanupRunning

    this.cleanupRunning = (async () => {
      try {
        if (!this.spilled) return
        if (!this.cleanupPending) return
        if (this.activeReaders > 0) return

        // Ensure file stream is closed
        try {
          if (this.fileStream && !this.fileStream.destroyed) {
            this.fileStream.destroy()
          }
        } catch {}

        // Remove file and directory (best-effort)
        try {
          if (this.filePath) await fsp.rm(this.filePath, { force: true })
        } catch {}
        try {
          if (this.tmpDir) await fsp.rm(this.tmpDir, { force: true, recursive: true })
        } catch {}

        // Null out for GC
        this.filePath = null
        this.tmpDir = null
        this.fileStream = null
      } finally {
        this.cleanupRunning = null
      }
    })()

    return this.cleanupRunning
  }

  private async cleanupAsync(): Promise<void> {
    this.cleanupPending = true
    await this.maybeCleanupSpill()
  }
}
