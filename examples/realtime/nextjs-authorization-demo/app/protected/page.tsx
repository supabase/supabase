'use client'
import CreateRoomModal from '@/components/create-room-modal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/realtime-js'
import { useState, useEffect } from 'react'

export default function Chat() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [rooms, setRooms] = useState<any>([])
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const getChannels = async () => {
    await supabase.auth.getUser()
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) return

    supabase.realtime.setAuth(token)
    const channels = await supabase.realtime.listChannels()
    setRooms(channels.map((channel) => channel.name))
    setLoading(false)
  }

  useEffect(() => {
    getChannels()
    supabase.auth.getUser().then((user) => setUserId(user.data.user?.id || null))
  }, [supabase])

  useEffect(() => {
    if (document.getElementById('chat')) {
      document.getElementById('chat')!.innerHTML = ''
    }

    if (selectedRoom) {
      channel?.unsubscribe()

      let newChannel = supabase.realtime.channel(selectedRoom, {
        config: { broadcast: { self: true } },
      })

      newChannel
        .on('broadcast', { event: 'message' }, ({ payload: payload }) => {
          const bubble = document.createElement('div')
          const mine =
            payload.user_id == userId ? ['bg-green-600', 'self-end'] : ['bg-blue-600', 'self-start']
          const style = [
            'flex',
            'gap-2',
            'items-center',
            'rounded-xl',
            'text-white',
            'text-bold',
            'w-2/3',
            'p-2',
          ].concat(mine)
          bubble.classList.add(...style)
          bubble.innerHTML = payload.message
          document.getElementById('chat')!.appendChild(bubble)
        })
        .subscribe((status, err) => {
          if (status == 'SUBSCRIBED') {
            setChannel(newChannel)
            setLoading(false)
            setError(null)
          }
          if (status == 'CLOSED') {
            setChannel(null)
          }
          if (status == 'CHANNEL_ERROR') {
            console.log({ status, err })
            setError(err?.message || null)
            setLoading(false)
          }
        })
    }
  }, [selectedRoom])

  return (
    <div className="flex w-full h-full p-10">
      {loading && (
        <div className="fixed top-0 left-0 right-0 flex flex-col h-full w-full justify-center items-center align-middle gap-2 z-10 bg-[#000000CC]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
        </div>
      )}
      {showModal ? <CreateRoomModal /> : ''}
      <div className="flex w-full h-full gap-4">
        <div className="grow-0 flex  flex-col gap-2">
          <div className="bg-white h-full rounded-sm text-slate-900">
            <div className="flex flex-col sm:max-w-md gap-2 text-foreground">
              {rooms?.map((room: string) => {
                return (
                  <button
                    key={room}
                    onClick={() => {
                      setLoading(true)
                      setSelectedRoom(room)
                    }}
                    className={
                      selectedRoom == room
                        ? 'bg-green-600 rounded-sm pointer p-1 text-white'
                        : 'rounded-sm cursor-pointer hover:bg-green-100 p-1 text-black'
                    }
                  >
                    # {room}
                  </button>
                )
              })}
            </div>
          </div>
          <button
            className="border border-foreground/20 rounded-md px-4 py-2 text-foreground"
            onClick={() => setShowModal(!showModal)}
          >
            Create Room
          </button>
        </div>
        <div className="grow flex flex-col gap-2">
          {error ? (
            <div className="bg-white h-full rounded-md text-slate-900 p-1 flex justify-center items-center">
              <h1 className="text-xl font-bold">You do not have access to this room</h1>
            </div>
          ) : (
            <div
              className="bg-white h-full rounded-md text-slate-900 p-1 flex flex-col gap-2"
              id="chat"
            />
          )}

          <form
            className="flex text-foreground w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const target = form.elements[0] as HTMLInputElement
              const message = target.value
              channel?.send({
                type: 'broadcast',
                event: 'message',
                payload: { message, user_id: userId },
              })
              target.value = ''
            }}
          >
            <label className="hidden" htmlFor="message" />
            <input
              name="message"
              className="grow rounded-md text-black p-2"
              placeholder="Insert your message"
              disabled={!channel}
            ></input>
            <button
              type="submit"
              className="border border-foreground/20 rounded-md px-4 py-2 text-foreground"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
