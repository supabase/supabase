import type * as Sentry from '@sentry/nextjs'

import { RingBuffer } from './ringBuffer'

export const MIRRORED_BREADCRUMBS = new RingBuffer<Sentry.Breadcrumb>(50)

export const getMirroredBreadcrumbs = (): Sentry.Breadcrumb[] => {
  return MIRRORED_BREADCRUMBS.toArray()
}

let BREADCRUMB_SNAPSHOT: Sentry.Breadcrumb[] | null = null

export const takeBreadcrumbSnapshot = (): void => {
  BREADCRUMB_SNAPSHOT = getMirroredBreadcrumbs()
}

export const getOwnershipOfBreadcrumbSnapshot = (): Sentry.Breadcrumb[] | null => {
  const snapshot = BREADCRUMB_SNAPSHOT
  BREADCRUMB_SNAPSHOT = null
  return snapshot
}
