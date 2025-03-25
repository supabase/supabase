import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import MeetupForm from '~/components/MeetupForm'
import supabase from '~/lib/supabaseAdmin'
import { Database } from '~/lib/database.types'
import CMSLayout from '~/components/Layouts/CMSLayout'
import dayjs from 'dayjs'

type Meetup = Database['public']['Tables']['meetups']['Row']
type MeetupInsert = Database['public']['Tables']['meetups']['Insert']

export default function EditMeetup() {
  const router = useRouter()
  const { id } = router.query
  const [meetup, setMeetup] = useState<Meetup | null>(null)

  useEffect(() => {
    if (id) fetchMeetup()
  }, [id])

  async function fetchMeetup() {
    const meetupId = Array.isArray(id) ? id[0] : id
    if (!meetupId) return

    const { data, error } = await supabase.from('meetups').select('*').eq('id', meetupId).single()

    console.log('data', data, error)
    if (error) {
      console.error('Error fetching meetup:', error)
      return
    }

    // Format the date to YYYY-MM-DDThh:mm for the input field
    const formattedData = {
      ...data,
      start_at: data.start_at ? dayjs(data.start_at).format('YYYY-MM-DDTHH:mm') : null,
    }

    setMeetup(formattedData as Meetup)
  }

  async function handleUpdate(formData: Partial<MeetupInsert>) {
    const meetupId = Array.isArray(id) ? id[0] : id
    if (!meetupId) return

    // Convert empty strings to null for optional fields
    const updateData = {
      ...formData,
      title: formData.title || null,
      country: formData.country || null,
      start_at: formData.start_at || null,
      link: formData.link || null,
      display_info: formData.display_info || null,
    }

    const { error } = await supabase.from('meetups').update(updateData).eq('id', meetupId)

    if (error) {
      console.error('Error updating meetup:', error)
      return
    }

    router.push('/cms/meetups')
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
          <h1 className="h1">Edit Meetup</h1>
        </div>

        <div className="bg-surface-200 border border-border rounded-lg p-6">
          <MeetupForm initialData={meetup} onSubmit={handleUpdate} submitLabel="Save Changes" />
        </div>
      </div>
    </CMSLayout>
  )
}
