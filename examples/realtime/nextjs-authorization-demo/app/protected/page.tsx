'use client'
import CreateRoomModal from '@/components/create-room-modal'
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useState, useEffect, use } from 'react'

export default function Chat() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [rooms, setRooms] = useState<string[]>([])
  const [users, setUsers] = useState<Set<string>>(new Set())
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>()
  const [mainChannel, setMainChannel] = useState<RealtimeChannel | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const getChannels = async () => {
    const channels = await supabase.from('rooms').select('topic')
    setRooms(channels.data?.map(({ topic }) => topic) || [])
  }

  const addUserToChannel = async (email: string) => {
    const user = await supabase.from('profiles').select('id').eq('email', email)
    if (!user.data?.length) {
      addMessage(true, true, `User ${email} not found`)
    } else {
      const room = await supabase.from('rooms').select('topic').eq('topic', selectedRoom)

      await supabase
        .from('rooms_users')
        .upsert({ user_id: user.data?.[0].id, room_topic: room.data?.[0].topic })
      addMessage(true, true, `Added ${email} to channel ${selectedRoom}`)
    }
  }

  const addMessage = async (mine: boolean, system: boolean, message: string) => {
    const bubble = document.createElement('div')
    const is_self_classes = mine ? ['bg-green-600', 'self-end'] : ['bg-blue-600', 'self-start']
    const is_system_classes = system ? ['bg-stone-500', 'self-center', 'italic', 'text-center'] : []
    const style = [
      'flex',
      'gap-2',
      'items-center',
      'rounded-xl',
      'text-white',
      'text-bold',
      'w-2/3',
      'p-2',
    ]
      .concat(is_self_classes)
      .concat(is_system_classes)
    bubble.classList.add(...style)
    bubble.innerHTML = message
    document.getElementById('chat')!.appendChild(bubble)
  }

  useEffect(() => {
    supabase.auth
      .getUser()
      .then((user) => setUser(user.data.user))
      .then(async () => {
        await supabase.auth.getUser()
        const token = (await supabase.auth.getSession()).data.session?.access_token!
        supabase.realtime.setAuth(token)
        let main = supabase
          .channel('supaslack')
          .on('broadcast', { event: 'new_room' }, () => getChannels())
          .subscribe()
        setMainChannel(main)
        getChannels()
      })
      .then(() => {
        setLoading(false)
      })
  }, [supabase])

  useEffect(() => {
    if (document.getElementById('chat')) {
      document.getElementById('chat')!.innerHTML = ''
    }

    if (selectedRoom) {
      channel?.unsubscribe()
      setUsers(new Set())

      let newChannel = supabase.channel(selectedRoom, {
        config: {
          broadcast: { self: true },
          private: true, // This line will tell the server that you want to use a private channel for this connection
        },
      })

      newChannel
        .on('broadcast', { event: 'message' }, ({ payload: payload }) =>
          addMessage(payload.user_id == user?.id, false, payload.message)
        )
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.map(({ email }) => users.add(email))
          setUsers(new Set(users))
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.map(({ email }) => users.delete(email))
          setUsers(new Set(users))
        })
        .subscribe((status, err) => {
          setLoading(false)

          if (status == 'SUBSCRIBED') {
            setChannel(newChannel)
            newChannel.track({ email: user?.email })
            setError(null)
          }
          if (status == 'CLOSED') {
            setChannel(null)
          }
          if (status == 'CHANNEL_ERROR') {
            setError(err?.message || null)
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
      {showModal ? <CreateRoomModal channel={mainChannel} /> : ''}
      <div className="flex w-full h-full gap-4">
        <div className="grow-0 flex flex-col gap-2 w-[20rem] overflow-hidden">
          <div className="bg-white h-full rounded-sm text-slate-900">
            <div className="flex flex-col">
              <div className="p-2 font-semibold bg-stone-100 w-full text-center">Rooms</div>
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
                        ? 'bg-green-600 rounded-sm pointer p-2 text-white text-left'
                        : 'rounded-sm cursor-pointer hover:bg-green-100 p-2 text-black text-left'
                    }
                  >
                    #{room}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="bg-white h-full rounded-sm text-slate-900">
            <div className="p-2 font-semibold bg-stone-100 w-full text-center">Users in Room</div>
            <div className="flex flex-col gap-2 p-2">
              {Array.from(users)?.map((email: string) => {
                return <div key={email}>{email}</div>
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

              if (message.startsWith('/invite')) {
                const email = message.replace('/invite ', '')
                addUserToChannel(email)
              } else {
                channel?.send({
                  type: 'broadcast',
                  event: 'message',
                  payload: { message, user_id: user?.id },
                })
              }

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
