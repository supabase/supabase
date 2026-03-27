'use client'

import { type ReactNode } from 'react'

import { RouteParamsOverrideProvider, type RouteParamsOverride } from 'common'

/**
 * Shared provider wrapper for v2 `/data/*` routes.
 *
 * Why: the existing `TableGridEditor` / grid hooks were built around
 * `common/useParams()` (Pages Router + `next/compat/router` query). On v2
 * (App Router), we bridge the needed params (`ref`, `id`, etc.) via an
 * override context so the grid stack can run unchanged.
 *
 * Future extension points:
 * - render different list surfaces (tabs, filtering, sorting)
 * - swap editable vs read-only grid presentations
 * - plug in per-entity loaders (tables, functions, types, roles, ...)
 */
export function StudioDataWorkspace({
  projectRef,
  id,
  additionalParams,
  children,
}: {
  projectRef?: string
  /** Mapped to the legacy `id` param used by the grid stack. */
  id?: string
  additionalParams?: RouteParamsOverride
  children: ReactNode
}) {
  const value: RouteParamsOverride = {
    ref: projectRef,
    id,
    ...(additionalParams ?? {}),
  }

  return <RouteParamsOverrideProvider value={value}>{children}</RouteParamsOverrideProvider>
}
