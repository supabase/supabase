import type { Metadata } from 'next'
import { getSortedPosts } from '~/lib/posts'
import EventsClient from './EventsClient'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Supabase Events: webinars, talks, hackathons, and meetups',
  description: 'Join Supabase and the open-source community at the upcoming events.',
}

export default async function EventsPage() {
  const staticEvents = getSortedPosts({
    directory: '_events',
    runner: '** EVENTS PAGE **',
  }) as any[]
  const allEvents = [...staticEvents].sort((a: any, b: any) => {
    const dateA = a.date ? new Date(a.date).getTime() : new Date(a.formattedDate).getTime()
    const dateB = b.date ? new Date(b.date).getTime() : new Date(b.formattedDate).getTime()
    return dateB - dateA
  })

  const upcomingEvents = allEvents.filter((event: any) =>
    event.end_date ? new Date(event.end_date!) >= new Date() : new Date(event.date!) >= new Date()
  )
  const onDemandEvents = allEvents.filter(
    (event: any) => new Date(event.date!) < new Date() && event.onDemand === true
  )

  const categories = upcomingEvents.reduce(
    (acc: { [key: string]: number }, event: any) => {
      acc.all = (acc.all || 0) + 1
      event.categories?.forEach((category: string) => {
        acc[category] = (acc[category] || 0) + 1
      })
      return acc
    },
    { all: 0 }
  )

  return (
    <EventsClient
      staticEvents={upcomingEvents}
      onDemandEvents={onDemandEvents}
      categories={categories}
    />
  )
}
