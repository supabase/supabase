import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '~/lib/supabaseAdmin'
import Link from 'next/link'
import { Database } from '~/lib/database.types'
import CMSLayout from '~/components/Layouts/CMSLayout'

type Meetup = Database['public']['Tables']['meetups']['Row']

export default function MeetupDetail() {
  const router = useRouter()
  const { id } = router.query
  const [meetup, setMeetup] = useState<Meetup | null>(null)

  useEffect(() => {
    if (id) fetchMeetup()
  }, [id])

  async function fetchMeetup() {
    const meetupId = id as string
    if (!meetupId) return

    const { data, error } = await supabase.from('meetups').select('*').eq('id', meetupId).single()

    console.log('data', data, error)
    if (error) {
      console.error('Error fetching meetup:', error)
      return
    }

    setMeetup(data as Meetup)
  }

  if (!meetup)
    return (
      <CMSLayout>
        <div>Loading...</div>
      </CMSLayout>
    )

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link href="/cms/meetups" className="text-sm text-foreground-light hover:underline">
            ← Back to Meetups
          </Link>
          <h1 className="h1">Meetup Details</h1>
        </div>

        <div className="bg-surface-200 border border-border rounded-lg p-6 space-y-4">
          <div className="grid gap-4">
            <div>
              <h2 className="text-sm font-medium text-foreground-light">Title</h2>
              <p className="mt-1 text-foreground">{meetup.title}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground-light">Country</h2>
              <p className="mt-1 text-foreground">{meetup.country}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground-light">Start Date</h2>
              <p className="mt-1 text-foreground">{meetup.start_at}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground-light">Display Info</h2>
              <p className="mt-1 text-foreground">{meetup.display_info}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground-light">Link</h2>
              <p className="mt-1 text-foreground">
                <a
                  href={meetup.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300"
                >
                  {meetup.link}
                </a>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-sm font-medium text-foreground-light">Status</h2>
                <span
                  className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    meetup.is_live ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {meetup.is_live ? 'Live' : 'Not Live'}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground-light">Published</h2>
                <span
                  className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    meetup.is_published
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {meetup.is_published ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href={`/cms/meetups/edit/${meetup.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-400 hover:bg-brand-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-300"
            >
              Edit Meetup
            </Link>
          </div>
        </div>
      </div>
    </CMSLayout>
  )
}
