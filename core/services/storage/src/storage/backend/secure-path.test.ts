import path from 'node:path'
import { resolveSecureFilesystemPath } from './secure-path'

describe('resolveSecureFilesystemPath', () => {
  const storageRoot = path.resolve('tmp', 'storage-root')

  it('resolves safe paths under the storage root', () => {
    expect(resolveSecureFilesystemPath(storageRoot, 'bucket/folder/file.txt')).toBe(
      path.join(storageRoot, 'bucket', 'folder', 'file.txt')
    )
  })

  it('normalizes the configured root path before resolving children', () => {
    const rootWithParentSegment = path.join(storageRoot, 'tenant', '..')

    expect(resolveSecureFilesystemPath(rootWithParentSegment, 'bucket/file.txt')).toBe(
      path.join(storageRoot, 'bucket', 'file.txt')
    )
  })

  it('allows child paths when the configured root is the filesystem root', () => {
    const filesystemRoot = path.parse(storageRoot).root

    expect(resolveSecureFilesystemPath(filesystemRoot, 'bucket/file.txt')).toBe(
      path.join(filesystemRoot, 'bucket', 'file.txt')
    )
  })

  it('allows double-dot in file names when not used as a path segment', () => {
    expect(resolveSecureFilesystemPath(storageRoot, 'bucket/file..name.txt')).toBe(
      path.join(storageRoot, 'bucket', 'file..name.txt')
    )
  })

  it.each([
    'bucket/dir/../file.txt',
    '.',
    '../escape.txt',
  ])('rejects dot path segments in %s', (relativePath) => {
    expect(() => resolveSecureFilesystemPath(storageRoot, relativePath)).toThrow(
      expect.objectContaining({
        code: 'InvalidKey',
      })
    )
  })

  it('rejects absolute posix paths', () => {
    expect(() => resolveSecureFilesystemPath(storageRoot, '/tmp/escape.txt')).toThrow(
      expect.objectContaining({
        code: 'InvalidKey',
      })
    )
  })

  it.each([
    'C:\\temp\\escape.txt',
    '\\\\server\\share\\escape.txt',
  ])('rejects absolute windows paths in %s format', (relativePath) => {
    expect(() => resolveSecureFilesystemPath(storageRoot, relativePath)).toThrow(
      expect.objectContaining({
        code: 'InvalidKey',
      })
    )
  })

  it('rejects null bytes', () => {
    expect(() => resolveSecureFilesystemPath(storageRoot, 'bucket/\0escape.txt')).toThrow(
      expect.objectContaining({
        code: 'InvalidKey',
      })
    )
  })

  it.each([
    {
      relativePath: 'bucket/\0escape.txt',
      expectedMessage: 'Invalid key: bucket/\0escape.txt contains null byte',
    },
    {
      relativePath: '/tmp/escape.txt',
      expectedMessage: 'Invalid key: /tmp/escape.txt must be a relative path',
    },
    {
      relativePath: '../escape.txt',
      expectedMessage: 'Invalid key: ../escape.txt contains dot path segment',
    },
  ])('keeps InvalidKey resource and message aligned for %s', ({
    relativePath,
    expectedMessage,
  }) => {
    try {
      resolveSecureFilesystemPath(storageRoot, relativePath)
      throw new Error('expected resolveSecureFilesystemPath to throw')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'InvalidKey',
        message: expectedMessage,
        resource: relativePath,
      })
    }
  })
})
