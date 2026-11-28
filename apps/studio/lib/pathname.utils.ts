/**
 * Pathname utilities for safe URL/path parsing.
 * Use these instead of direct array indexing (e.g. pathname.split('/')[3]) to avoid undefined access.
 */

/**
 * Returns the path segment at the given index, or undefined if out of bounds.
 * Segments are from splitting on '/', e.g. '/org/my-org/team' → ['', 'org', 'my-org', 'team']
 * Index 0 = '', 1 = 'org', 2 = 'my-org', 3 = 'team'
 */
export function getPathSegment(pathname: string, index: number): string | undefined {
  const segments = pathname.split('/')
  const segment = segments[index]
  return segment
}
