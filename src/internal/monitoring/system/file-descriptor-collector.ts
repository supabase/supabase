import { Meter } from '@opentelemetry/api'
import { exec } from 'child_process'
import * as fs from 'fs/promises'
import { promisify } from 'util'
import { BaseCollector } from './base-collector'

const execAsync = promisify(exec)

/**
 * Collector for file descriptor metrics.
 * Works on Linux by reading from /proc/self/fd and /proc/self/limits.
 * On other platforms, metrics will not be collected.
 */
export class FileDescriptorCollector extends BaseCollector {
  private _maxFds: number | null = null
  private _openFds: number | null = null
  private _updateInterval: NodeJS.Timeout | null = null

  updateMetricInstruments(meter: Meter): void {
    // Open file descriptors gauge
    meter
      .createObservableGauge(`${this.namePrefix}process.open_fds`, {
        description: 'Number of open file descriptors',
      })
      .addCallback((observable) => {
        if (!this._enabled || this._openFds === null) return
        observable.observe(this._openFds, this.labels)
      })

    // Max file descriptors gauge
    meter
      .createObservableGauge(`${this.namePrefix}process.max_fds`, {
        description: 'Maximum number of file descriptors allowed',
      })
      .addCallback((observable) => {
        if (!this._enabled || this._maxFds === null) return
        observable.observe(this._maxFds, this.labels)
      })
  }

  /**
   * Get the number of open file descriptors
   * On macOS: counts entries in /dev/fd
   * On Linux: counts entries in /proc/self/fd
   */
  private async getOpenFileDescriptors(): Promise<number | null> {
    try {
      // Both macOS (/dev/fd) and Linux (/proc/self/fd) support directory-based FD counting
      const fdPath = process.platform === 'darwin' ? '/dev/fd' : '/proc/self/fd'

      if (process.platform === 'darwin' || process.platform === 'linux') {
        const fds = await fs.readdir(fdPath)
        // Subtract 1 because readdir itself opens an FD
        return Math.max(0, fds.length - 1)
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Get the maximum number of file descriptors
   * On macOS: uses ulimit -n command
   * On Linux: parses /proc/self/limits
   */
  private async getMaxFileDescriptors(): Promise<number | null> {
    if (this._maxFds !== null) {
      return this._maxFds
    }

    try {
      // macOS: use ulimit -n command
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('ulimit -n')
        const limit = parseInt(stdout.trim(), 10)
        if (!isNaN(limit)) {
          this._maxFds = limit
          return limit
        }
        return null
      }

      // Linux: read from /proc/self/limits
      if (process.platform === 'linux') {
        const limits = await fs.readFile('/proc/self/limits', 'utf8')
        const lines = limits.split('\n')

        for (const line of lines) {
          if (line.startsWith('Max open files')) {
            const parts = line.split(/\s+/)
            const softLimit = parseInt(parts[3], 10)
            if (!isNaN(softLimit)) {
              this._maxFds = softLimit
              return softLimit
            }
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  protected internalEnable(): void {
    this._maxFds = null
    this._openFds = null

    // Update metrics periodically
    this.updateMetrics().catch(() => {
      // Ignore errors
    })
    this._updateInterval = setInterval(() => this.updateMetrics().catch(() => {}), 5000)
    this._updateInterval.unref()
  }

  protected internalDisable(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval)
      this._updateInterval = null
    }
    this._maxFds = null
    this._openFds = null
  }

  private async updateMetrics(): Promise<void> {
    this._maxFds = await this.getMaxFileDescriptors()
    this._openFds = await this.getOpenFileDescriptors()
  }
}
