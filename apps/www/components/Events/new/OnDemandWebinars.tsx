'use client'

import { useEvents } from '~/app/events/context'
import Link from 'next/link'
import { Badge } from 'ui'

export function OnDemandWebinars() {
  const { pastWebinars } = useEvents()

  if (pastWebinars.length === 0) return null

  return (
    <section className="flex flex-col gap-6">
      <ul className="grid gap-4 sm:grid-cols-2">
        {pastWebinars.map((event) => {
          const internalPath = event.path
          const externalLink = event.link
          const watchHref = internalPath || externalLink?.href
          const watchTarget: '_blank' | '_self' | undefined = internalPath
            ? '_self'
            : externalLink?.target

          const eventDate = new Date(event.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })

          return (
            <li
              key={`${event.source}-${event.slug}-${event.date}`}
              className="bg-surface-100 border rounded-md p-4 flex flex-col gap-4 relative hover:border-stronger transition-colors"
            >
              {watchHref && (
                <Link
                  className="absolute inset-0"
                  href={watchHref}
                  target={watchTarget}
                  rel={watchTarget === '_blank' ? 'noopener noreferrer' : undefined}
                  aria-label={`Watch ${event.title}`}
                />
              )}

              <div className="flex items-start justify-between gap-2">
                <Badge>Webinar</Badge>
                <span className="text-xs text-foreground-light">{eventDate}</span>
              </div>

              <h3 className="text-base font-medium leading-snug line-clamp-2">{event.title}</h3>

              {event.description && (
                <p className="text-sm text-foreground-light line-clamp-3 flex-1">
                  {event.description}
                </p>
              )}

              {event.hosts.length > 0 && (
                <div className="flex gap-2 items-center text-xs text-foreground-light">
                  <div className="size-5 rounded-full border bg-linear-to-br from-background-surface-100 to-background-surface-200 relative overflow-hidden">
                    {event.hosts[0]?.avatar_url && (
                      <img
                        src={event.hosts[0].avatar_url}
                        alt={event.hosts[0].name || 'Host image'}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {event.hosts[0]?.name || 'Supabase'}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
