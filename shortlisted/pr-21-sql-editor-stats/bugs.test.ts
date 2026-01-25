/**
 * Tests proving bugs in PR #21
 * 
 * Category: BAD CODE PRACTICE - Not reusing existing utilities
 */

describe('PR #21: Bad Practice - Not Reusing Utilities', () => {

  /**
   * BUG 1: formatExecutionTime duplicates formatDuration from QueryPerformance.utils.ts
   */
  describe('formatExecutionTime - Duplicates Existing formatDuration', () => {
    // NEW implementation in SQLEditor.utils.ts
    const formatExecutionTime = (ms: number): string => {
      if (ms < 1000) {
        return `${ms.toFixed(2)}ms`
      } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(2)}s`
      } else {
        const minutes = Math.floor(ms / 60000)
        const seconds = ((ms % 60000) / 1000).toFixed(0)
        return `${minutes}m ${seconds}s`
      }
    }

    // EXISTING implementation uses dayjs.duration - different behavior!
    // from: apps/studio/components/interfaces/QueryPerformance/QueryPerformance.utils.ts
    // 
    // export const formatDuration = (milliseconds: number) => {
    //   const duration = dayjs.duration(milliseconds, 'milliseconds')
    //   const days = Math.floor(duration.asDays())
    //   const hours = duration.hours()
    //   // ... etc
    // }

    it('has different behavior than existing formatDuration', () => {
      // formatExecutionTime: 90000ms -> "1m 30s"
      expect(formatExecutionTime(90000)).toBe('1m 30s')
      
      // formatDuration (existing): 90000ms -> "1m 30s" (might format differently)
      // The implementations are different - one uses dayjs, one doesn't
      // This creates inconsistency across the codebase
    })

    it('does not handle edge cases like existing function', () => {
      // Negative time - not handled
      expect(formatExecutionTime(-100)).toBe('-100.00ms') // Should error or return "0ms"
      
      // Very large time - no day support
      expect(formatExecutionTime(86400000)).toBe('1440m 0s') // Should be "1d" like formatDuration
    })
  })

  /**
   * BUG 2: formatResultSize duplicates formatBytes from lib/helpers.ts
   */
  describe('formatResultSize - Duplicates Existing formatBytes', () => {
    // NEW implementation in SQLEditor.utils.ts
    const formatResultSize = (bytes: number): string => {
      if (bytes < 1024) {
        return `${bytes} B`
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`  // 1 decimal place
      } else if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      } else {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
      }
    }

    // EXISTING implementation in lib/helpers.ts
    // export const formatBytes = (bytes: any, decimals = 2, size?) => {
    //   const dm = decimals < 0 ? 0 : decimals  // 2 decimal places by default
    //   // ... handles negative, PB, EB, ZB, YB
    // }

    it('has different decimal places than existing formatBytes', () => {
      // formatResultSize uses 1 decimal place
      expect(formatResultSize(2048)).toBe('2.0 KB')
      
      // formatBytes uses 2 decimal places by default
      // formatBytes(2048) -> '2.00 KB'
      // INCONSISTENT!
    })

    it('does not support optional size parameter', () => {
      // formatBytes(1024, 2, 'KB') -> '1.00 KB' (force specific unit)
      // formatResultSize has no such feature
    })

    it('does not handle negative bytes', () => {
      expect(formatResultSize(-1024)).toBe('-1.0 KB') // Should handle properly like formatBytes
    })
  })

  /**
   * BUG 3: No edge case handling for 0 and negative values
   */
  describe('Edge Cases Not Handled', () => {
    const formatExecutionTime = (ms: number): string => {
      if (ms < 1000) return `${ms.toFixed(2)}ms`
      else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
      else {
        const minutes = Math.floor(ms / 60000)
        const seconds = ((ms % 60000) / 1000).toFixed(0)
        return `${minutes}m ${seconds}s`
      }
    }

    const formatResultSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      else return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }

    it('formatExecutionTime handles 0 but not negative', () => {
      expect(formatExecutionTime(0)).toBe('0.00ms')
      expect(formatExecutionTime(-500)).toBe('-500.00ms') // Should be handled!
    })

    it('formatResultSize handles 0 but not negative', () => {
      expect(formatResultSize(0)).toBe('0 B')
      expect(formatResultSize(-1024)).toBe('-1.0 KB') // Should be handled!
    })

    it('no NaN or Infinity handling', () => {
      expect(formatExecutionTime(NaN)).toBe('NaNms')
      expect(formatExecutionTime(Infinity)).toBe('Infinitym NaNs')
      expect(formatResultSize(NaN)).toBe('NaN B')
    })
  })
})

/**
 * SUMMARY:
 * 
 * Bugs planted:
 * 1. formatExecutionTime duplicates formatDuration (bad practice)
 * 2. formatResultSize duplicates formatBytes (bad practice)
 * 3. Different behavior/decimal places (inconsistency)
 * 4. No edge case handling for negative/NaN/Infinity
 * 
 * What Greptile should catch:
 * - Code duplication / not reusing existing utilities
 * - Inconsistent formatting across codebase
 * - Missing edge case handling
 * 
 * What Greptile might miss:
 * - The subtle difference in decimal places (1 vs 2)
 * - That formatDuration exists in a different file
 */
