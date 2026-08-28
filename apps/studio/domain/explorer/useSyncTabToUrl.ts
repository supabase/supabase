import { useAtomSubscribe } from '@effect/atom-react'
import { useNavigate } from '@tanstack/react-router'
import { Match, Option } from 'effect'
import { useCallback } from 'react'

import { currentTabRouteAtom, type ExplorerTabRoute } from './explorer.tabs'

/**
 * Keeps the URL in sync with the current explorer tab. `useAtomSubscribe`
 * (rather than `useAtomValue` + `useEffect`) fits here because this hook
 * never needs to render from the tab — it only reacts to it, so there's no
 * reason to re-render this component on every tab change.
 *
 * The callback is memoized with `useCallback`: `useAtomSubscribe` re-subscribes
 * whenever its callback's identity changes, and with `immediate: true` that
 * means re-firing it — an inline closure would get a new identity every
 * render, so it would re-navigate (and thus re-render) on every render,
 * looping forever.
 */
export const useSyncTabToUrl = (projectRef: string) => {
  const navigate = useNavigate()

  const syncUrl = useCallback(
    (route: Option.Option<ExplorerTabRoute>) => {
      if (Option.isNone(route)) {
        navigate({ to: '/project/$ref/explorer-test', params: { ref: projectRef }, replace: true })
        return
      }

      Match.value(route.value).pipe(
        Match.tagsExhaustive({
          query: ({ contentId }) =>
            navigate({
              to: '/project/$ref/explorer-test/query/$id',
              params: { ref: projectRef, id: contentId },
              replace: true,
            }),
          notebook: ({ contentId }) =>
            navigate({
              to: '/project/$ref/explorer-test/notebook/$id',
              params: { ref: projectRef, id: contentId },
              replace: true,
            }),
          chat: ({ contentId }) =>
            navigate({
              to: '/project/$ref/explorer-test/chat/$id',
              params: { ref: projectRef, id: contentId },
              replace: true,
            }),
        })
      )
    },
    [projectRef, navigate]
  )

  useAtomSubscribe(currentTabRouteAtom, syncUrl, { immediate: true })
}
