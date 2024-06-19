'use client'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { SubmitButton } from './submit-button'
import { useEffect, useState } from 'react'

export default function CreateRoomModal() {
  const supabase = createClient()
  const [emails, setEmails] = useState<{ email: string; user_id: string }[] | undefined>([])
  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .then((res) => setEmails(res.data as { email: string; user_id: string }[]))
  }, [])

  const createRoom = async (formData: FormData) => {
    const name = formData.get('name') as string
    const ids = formData.getAll('emails[]')
    await supabase.auth.getUser()
    const token = (await supabase.auth.getSession()).data.session!.access_token
    supabase.realtime.setAuth(token)
    await supabase.realtime.createChannel(name)
    await supabase.from('rooms_users').insert(ids.map((user_id) => ({ user_id, name })))
    return redirect(`/protected`)
  }

  const close = async () => {
    return redirect(`/protected`)
  }
  return (
    <div className="fixed top-0 left-0 right-0 flex flex-col h-full w-full justify-center items-center align-middle gap-2 z-10 bg-[#000000AA]">
      <form className="flex flex-col sm:max-w-md gap-2 text-foreground bg-background rounded-md p-4">
        <label className="text-md" htmlFor="email">
          Room
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="name"
          placeholder="room_1"
        />
        {emails && (
          <div className="flex flex-col">
            {emails?.map(({ email, user_id }) => (
              <div key={`container_${email}`}>
                <input key={`label_${email}`} type="checkbox" name="emails[]" value={user_id} />

                <label key={email} htmlFor="emails[]">
                  {email}
                </label>
              </div>
            ))}
          </div>
        )}
        <SubmitButton
          formAction={createRoom}
          className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2"
          pendingText="Creating"
        >
          Create Room
        </SubmitButton>
        <SubmitButton
          formAction={close}
          className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2"
          pendingText="Closing"
        >
          Close
        </SubmitButton>
      </form>
    </div>
  )
}
