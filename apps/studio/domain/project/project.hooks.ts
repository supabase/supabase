import { useParams } from 'common'

/**
 * Reads the current project ref, throwing when called outside a
 * project-scoped route instead of forcing every caller to guard against
 * `undefined`.
 */
export const useProjectRef = (): string => {
  const { ref } = useParams()

  if (ref === undefined) {
    throw new Error('useProjectRef() was called outside of a project-scoped route')
  }

  return ref
}
