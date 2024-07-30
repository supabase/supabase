'use client'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { SubmitButton } from './submit-button'
import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

export default function CreateRoomModal({ channel }: { channel: RealtimeChannel | null }) {
  const supabase = createClient()
  const createRoom = async (formData: FormData) => {
    const topic = formData.get('topic') as string
    const user = await supabase.auth.getUser()
    const token = (await supabase.auth.getSession()).data.session!.access_token

    supabase.realtime.setAuth(token)

    const rooms_response = await supabase.from('rooms').insert({ topic }).select('topic')

    if (rooms_response.data) {
      await supabase
        .from('rooms_users')
        .insert({ user_id: user.data.user!.id, room_topic: rooms_response.data![0].topic })

      await channel?.send({
        type: 'broadcast',
        event: 'new_room',
        payload: {},
      })

      return redirect(`/protected`)
    }
  }

  const close = async () => {
    return redirect(`/protected`)
  }

  return (
    <div className="fixed top-0 left-0 right-0 flex flex-col h-full w-full justify-center items-center align-middle gap-2 z-10 bg-[#000000EE]">
      <form className="flex flex-col sm:max-w-md gap-2 text-foreground bg-background rounded-md p-4">
        <label className="text-lg font-semibold" htmlFor="email">
          Create a Room
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="topic"
          placeholder="room_1"
        />
        <div className="flex justify-between gap-4">
          <SubmitButton
            formAction={createRoom}
            className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2 w-[10rem]"
            pendingText="Creating"
          >
            Create Room
          </SubmitButton>
          <SubmitButton
            formAction={close}
            className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2 w-[10rem]"
            pendingText="Closing"
          >
            Close
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}
