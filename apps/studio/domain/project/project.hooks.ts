import { RegistryContext } from '@effect/atom-react'
import { useParams } from 'common'
import { Option } from 'effect'
import { useContext, useLayoutEffect } from 'react'

import { projectRefAtom } from './project.atoms'

/**
 * Bridges the router's project ref into `projectRefAtom`. Writing must
 * happen in `useLayoutEffect`, not render: `registry.set` synchronously
 * notifies subscribers (e.g. `withProjectRef`'s `useAtomValue`), and any
 * subscriber already mounted from a prior render would have its setState
 * called while this component is still rendering, which React forbids.
 * `useLayoutEffect` still runs before paint, so there's no visible flicker,
 * and the dependency array keeps the write idempotent across re-renders.
 */
export const useSyncProjectRef = () => {
  const { ref } = useParams()
  const registry = useContext(RegistryContext)

  useLayoutEffect(() => {
    registry.set(projectRefAtom, Option.fromUndefinedOr(ref))
  }, [ref, registry])
}
