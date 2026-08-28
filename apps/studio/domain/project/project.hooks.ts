import { RegistryContext } from '@effect/atom-react'
import { useParams } from 'common'
import { Option } from 'effect'
import { useContext, useRef } from 'react'

import { projectRefAtom } from './project.atoms'

/**
 * Bridges the router's project ref into `projectRefAtom`, writing during
 * render rather than in an effect. `useEffect` runs after commit, so a
 * component reading the atom in the same render pass that mounts this hook
 * would still see the stale (empty) value — writing synchronously here means
 * anything rendered after this call, in the same pass, sees the current ref
 * immediately. The `lastRef` guard keeps the write idempotent so repeated
 * renders (including React's Strict Mode double-invoke) don't re-trigger it.
 */
export const useSyncProjectRef = () => {
  const { ref } = useParams()
  const registry = useContext(RegistryContext)
  const lastRef = useRef<string | undefined>(undefined)

  if (lastRef.current !== ref) {
    lastRef.current = ref
    registry.set(projectRefAtom, Option.fromUndefinedOr(ref))
  }
}
