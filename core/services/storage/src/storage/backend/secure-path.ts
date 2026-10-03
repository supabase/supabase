import { ErrorCode, StorageBackendError } from '@internal/errors'
import path from 'path'

/**
 * Resolve a user-controlled relative path under a fixed filesystem root.
 * Rejects null bytes, absolute paths, and `.` / `..` path segments before resolution.
 */
export function resolveSecureFilesystemPath(rootPath: string, relativePath: string): string {
  if (relativePath.includes('\0')) {
    throwInvalidKey(relativePath, 'contains null byte')
  }

  if (path.isAbsolute(relativePath)) {
    throwInvalidKey(relativePath, 'must be a relative path')
  }

  const isWindowsDriveAbsolutePath = /^[a-zA-Z]:[\\/]/.test(relativePath)
  const isWindowsUncPath = /^\\\\[^\\/]+[\\/][^\\/]+/.test(relativePath)
  if (isWindowsDriveAbsolutePath || isWindowsUncPath) {
    throwInvalidKey(relativePath, 'must not be an absolute Windows path')
  }

  const hasDotTraversalSegment = relativePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .some((segment) => segment === '.' || segment === '..')

  if (hasDotTraversalSegment) {
    throwInvalidKey(relativePath, 'contains dot path segment')
  }

  const normalizedRootPath = path.normalize(path.resolve(rootPath))
  const resolvedPath = path.resolve(normalizedRootPath, relativePath)
  const normalizedPath = path.normalize(resolvedPath)
  const normalizedRootPrefix = normalizedRootPath.endsWith(path.sep)
    ? normalizedRootPath
    : normalizedRootPath + path.sep

  if (!normalizedPath.startsWith(normalizedRootPrefix) && normalizedPath !== normalizedRootPath) {
    throwInvalidKey(relativePath, 'resolves outside storage directory')
  }

  return normalizedPath
}

function throwInvalidKey(relativePath: string, reason: string): never {
  throw new StorageBackendError({
    code: ErrorCode.InvalidKey,
    resource: relativePath,
    httpStatusCode: 400,
    message: `Invalid key: ${relativePath} ${reason}`,
  })
}
