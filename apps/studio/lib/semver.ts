/**
 * Semantic versioning utility for comparing version strings in the format "x.x.x"
 */

export interface SemverVersion {
  major: number
  minor: number
  patch: number
}

/**
 * Parses a semver string in the format "x.x.x" into its components
 * @param version - The version string to parse (e.g., "1.2.3")
 * @returns The parsed version components or null if invalid
 */
export function parseSemver(version: string): SemverVersion | null {
  if (!version || typeof version !== 'string') {
    return null
  }

  const parts = version.trim().split('.')

  if (parts.length !== 3) {
    return null
  }

  const major = parseInt(parts[0], 10)
  const minor = parseInt(parts[1], 10)
  const patch = parseInt(parts[2], 10)

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null
  }

  if (major < 0 || minor < 0 || patch < 0) {
    return null
  }

  return { major, minor, patch }
}

/**
 * Compares two semver version strings
 * @param a - First version string
 * @param b - Second version string
 * @returns -1 if a < b, 0 if a === b, 1 if a > b, or null if either version is invalid
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 | null {
  const versionA = parseSemver(a)
  const versionB = parseSemver(b)

  if (!versionA || !versionB) {
    return null
  }

  if (versionA.major !== versionB.major) {
    return versionA.major > versionB.major ? 1 : -1
  }

  if (versionA.minor !== versionB.minor) {
    return versionA.minor > versionB.minor ? 1 : -1
  }

  if (versionA.patch !== versionB.patch) {
    return versionA.patch > versionB.patch ? 1 : -1
  }

  return 0
}

/**
 * Checks if version a is greater than version b
 * @param a - First version string
 * @param b - Second version string
 * @returns true if a > b, false otherwise
 */
export function isGreaterThan(a: string, b: string): boolean {
  return compareSemver(a, b) === 1
}

/**
 * Checks if version a is less than version b
 * @param a - First version string
 * @param b - Second version string
 * @returns true if a < b, false otherwise
 */
export function isLessThan(a: string, b: string): boolean {
  return compareSemver(a, b) === -1
}

/**
 * Checks if version a is equal to version b
 * @param a - First version string
 * @param b - Second version string
 * @returns true if a === b, false otherwise
 */
export function isEqual(a: string, b: string): boolean {
  return compareSemver(a, b) === 0
}

/**
 * Checks if version a is greater than or equal to version b
 * @param a - First version string
 * @param b - Second version string
 * @returns true if a >= b, false otherwise
 */
export function isGreaterThanOrEqual(a: string, b: string): boolean {
  const result = compareSemver(a, b)
  return result === 1 || result === 0
}

/**
 * Checks if version a is less than or equal to version b
 * @param a - First version string
 * @param b - Second version string
 * @returns true if a <= b, false otherwise
 */
export function isLessThanOrEqual(a: string, b: string): boolean {
  const result = compareSemver(a, b)
  return result === -1 || result === 0
}

/**
 * Checks if a version string is valid
 * @param version - The version string to validate
 * @returns true if the version is valid, false otherwise
 */
export function isValidSemver(version: string): boolean {
  return parseSemver(version) !== null
}
