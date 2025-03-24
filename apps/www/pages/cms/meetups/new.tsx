import { useRouter } from 'next/router'
import supabase from '~/lib/supabaseAdmin'
import Link from 'next/link'
import MeetupForm from '~/components/MeetupForm'
import { Database } from '~/types/supabase'
import CMSLayout from '~/components/Layouts/CMSLayout'

type MeetupInsert = Database['public']['Tables']['meetups']['Insert']

export default function NewMeetup() {
  const router = useRouter()

  async function handleCreate(formData: Partial<MeetupInsert>) {
    // Convert empty strings to null for optional fields
    const insertData = {
      ...formData,
      title: formData.title || null,
      country: formData.country || null,
      start_at: formData.start_at || null,
      link: formData.link || null,
      display_info: formData.display_info || null,
      launch_week: 'lw14', // Default to lw14 for now
    }

    const { error } = await supabase.from('meetups').insert([insertData])

    if (error) {
      console.error('Error creating meetup:', error)
      return
    }

    router.push('/cms/meetups')
  }

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link href="/cms/meetups" className="text-sm font-medium text-foreground-light">
            ← Back to Meetups
          </Link>
          <h1 className="h1">Create New Meetup</h1>
        </div>

        <div className="bg-surface-200 border border-border rounded-lg p-6">
          <MeetupForm onSubmit={handleCreate} submitLabel="Create Meetup" />
        </div>
      </div>
    </CMSLayout>
  )
}
