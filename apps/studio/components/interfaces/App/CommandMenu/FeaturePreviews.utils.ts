import { type FeaturePreview } from '@/components/interfaces/App/FeaturePreview/useFeaturePreviews'

export type FeaturePreviewToggleOutcome =
  | { type: 'disabled' }
  | { type: 'enabled'; route?: string }

/**
 * Decides what should happen when a feature preview is toggled from the
 * Cmd+K "Feature previews" page: whether to route the user to where they can
 * try the feature out, or just flip the flag in place.
 *
 * `ref` alone isn't enough to decide this — it can retain a stale project ref
 * after client-side navigating away from `/project/[ref]/...` to a route
 * without that segment (e.g. the org view) — so routing is also gated on the
 * current pathname actually being project-scoped.
 */
export function resolveFeaturePreviewToggle({
  preview,
  isEnabling,
  pathname,
  ref,
}: {
  preview: Pick<FeaturePreview, 'getRoute'>
  isEnabling: boolean
  pathname: string
  ref: string | undefined
}): FeaturePreviewToggleOutcome {
  if (!isEnabling) return { type: 'disabled' }

  const isProjectScopedRoute = pathname.startsWith('/project/')
  const route = isProjectScopedRoute ? preview.getRoute?.(ref) : undefined

  if (route !== undefined && ref !== undefined) {
    return { type: 'enabled', route }
  }

  return { type: 'enabled' }
}
