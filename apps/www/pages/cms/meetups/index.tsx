import { useEffect, useState } from 'react'
import supabase from '~/lib/supabaseAdmin'
import Link from 'next/link'
import { Database } from '~/lib/database.types'
import CMSLayout from '~/components/Layouts/CMSLayout'
import dayjs from 'dayjs'
import { Button } from 'ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

type Meetup = Database['public']['Tables']['meetups']['Row']
type MeetupInsert = Database['public']['Tables']['meetups']['Insert']

export default function MeetupsCMS() {
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [meetupToDelete, setMeetupToDelete] = useState<Meetup | null>(null)

  useEffect(() => {
    fetchMeetups()
  }, [])

  async function fetchMeetups() {
    const { data, error } = await supabase
      .from('meetups')
      .select('*')
      .order('start_at', { ascending: true })

    if (error) {
      console.error('Error fetching meetups:', error)
      return
    }

    setMeetups(data as Meetup[])
  }

  async function handleImport(meetups: MeetupInsert[]) {
    const { error } = await supabase.from('meetups').insert(meetups)

    if (error) {
      console.error('Error importing meetups:', error)
      return
    }

    // Refresh the list after import
    fetchMeetups()
  }

  async function handleDelete() {
    if (!meetupToDelete) return

    const { error } = await supabase.from('meetups').delete().eq('id', meetupToDelete.id.toString())

    if (error) {
      console.error('Error deleting meetup:', error)
      return
    }

    // Refresh the list after deletion
    fetchMeetups()
    setShowDeleteConfirm(false)
    setMeetupToDelete(null)
  }

  async function handleStatusChange(
    meetupId: string | number,
    field: 'is_live' | 'is_published',
    value: boolean
  ) {
    const { error } = await supabase
      .from('meetups')
      .update({ [field]: value })
      .eq('id', meetupId.toString())

    if (error) {
      console.error('Error updating meetup status:', error)
      return
    }

    // Update local state
    setMeetups(
      meetups.map((meetup) => (meetup.id === meetupId ? { ...meetup, [field]: value } : meetup))
    )
  }

  return (
    <CMSLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="h1">Meetups CMS</h1>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/cms/meetups/new">Add Meetup</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          {meetups.map((meetup) => (
            <div
              key={meetup.id}
              className="bg-surface-200 border border-border rounded-lg px-4 py-2 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm flex-2 font-medium text-foreground lg:min-w-[300px] truncate">
                  {meetup.title || 'Unnamed Meetup'}
                </span>
                <span className="text-sm text-foreground-light min-w-[100px]">
                  {meetup.country}
                </span>
                <span className="text-sm text-foreground-light min-w-[100px]">
                  {meetup.start_at ? dayjs(meetup.start_at).format('DD MMM YY') : 'No date'}
                </span>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          meetup.is_live
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {meetup.is_live ? 'Live' : 'Not Live'}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(meetup.id, 'is_live', true)}
                      >
                        Live
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(meetup.id, 'is_live', false)}
                      >
                        Not Live
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          meetup.is_published
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {meetup.is_published ? 'Published' : 'Draft'}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(meetup.id, 'is_published', true)}
                      >
                        Published
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(meetup.id, 'is_published', false)}
                      >
                        Draft
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/cms/meetups/${meetup.id}`}
                  className="text-sm text-foreground-light hover:text-foreground"
                >
                  View
                </Link>
                <Link
                  href={`/cms/meetups/edit/${meetup.id}`}
                  className="text-sm text-foreground-light hover:text-foreground"
                >
                  Edit
                </Link>
                <button
                  onClick={() => {
                    setMeetupToDelete(meetup)
                    setShowDeleteConfirm(true)
                  }}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showDeleteConfirm && meetupToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface-200 border border-border rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
              <p className="text-sm text-foreground-light mb-4">
                Are you sure you want to delete "{meetupToDelete.title || 'Unnamed Meetup'}"? This
                action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setMeetupToDelete(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground-light hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  )
}
