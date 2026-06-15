import * as Sentry from '@sentry/nextjs'
import { notFound } from 'next/navigation'

/**
 * Triggers a Next.js 404 while recording the requested path as a Sentry tag.
 *
 * `notFound()` itself does not create a Sentry event, but tagging the active
 * scope means any error captured during the same request (and any event the
 * Sentry SDK records for the render) carries the exact path under
 * `404.pathname`. That makes 404s filterable and groupable in Sentry/Discover
 * instead of only being inferable from the route's transaction name.
 *
 * @param pathname - The user-facing path that was not found, e.g.
 * `/guides/functions/runtimes/node-22`.
 */
export function notFoundWithPathname(pathname: string): never {
  Sentry.setTag('404.pathname', pathname)
  notFound()
}
