/**
 * Lightweight logging utility
 *
 * Performance considerations:
 * - Zero-cost when disabled
 * - Lazy string evaluation
 * - Minimal allocations
 */

// ============================================================================
// LOG LEVELS
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;

  /**
   * Set global log level
   */
  static setLevel(level: LogLevel): void {
    Logger.currentLevel = level;
  }

  /**
   * Debug log (only in verbose mode)
   * Performance: Zero-cost when level > DEBUG
   */
  static debug(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info log
   * Performance: Zero-cost when level > INFO
   */
  static info(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning log
   * Performance: Zero-cost when level > WARN
   */
  static warn(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Error log
   * Performance: Zero-cost when level > ERROR
   */
  static error(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  /**
   * Log with custom level
   */
  static log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= level) {
      switch (level) {
        case LogLevel.DEBUG:
          Logger.debug(message, ...args);
          break;
        case LogLevel.INFO:
          Logger.info(message, ...args);
          break;
        case LogLevel.WARN:
          Logger.warn(message, ...args);
          break;
        case LogLevel.ERROR:
          Logger.error(message, ...args);
          break;
      }
    }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const { debug, info, warn, error, setLevel } = Logger;
