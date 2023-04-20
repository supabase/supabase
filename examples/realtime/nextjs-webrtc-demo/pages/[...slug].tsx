import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { nanoid } from 'nanoid'
import SimplePeer from 'simple-peer'

import type { NextPage } from 'next'

import {
  RealtimeChannel,
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
} from '@supabase/supabase-js'
import Loader from '../components/Loader'
import supabaseClient from '../client'
import WaitlistPopover from '../components/WaitlistPopover'
import { getRandomColors, getRandomUniqueColor } from '../lib/RandomColor'
import Users from '../components/Users'
import AudioVisualizer from '../components/AudioVisualizer'

import type { RealtimeChannelSendResponse } from '@supabase/supabase-js'

import { Copy, Mic, MoreVertical, Phone } from 'lucide-react'
import { cn } from '../lib/cn'

const MAX_ROOM_USERS = 5

const currentUserId = nanoid()

export interface User {
  color: string
  bg: string
  'bg-strong': string
  border: string
  stream?: MediaStream
  text: string
  remotePeer?: SimplePeer.Instance
}

const Room: NextPage = () => {
  const router = useRouter()
  const { slug } = router.query
  const slugRoomId: string | undefined = Array.isArray(slug) ? slug[0] : undefined

  const [roomId, setRoomId] = useState<string | undefined>(undefined)
  const [currentUserStream, setCurrentUserStream] = useState<MediaStream | undefined>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})

  const [mute, setMute] = useState<boolean | undefined>(false)

  const usersRef = useRef<{ [key: string]: User }>({})

  const mapInitialUsers = (channel: RealtimeChannel) => {
    const _users = Object.keys(channel.presenceState())

    if (!_users) return

    const colors = Object.keys(usersRef.current).length === 0 ? getRandomColors(_users.length) : []

    if (_users) {
      setUsers((existingUsers) => {
        const updatedUsers = _users.reduce(
          (acc: { [key: string]: User }, userId: string, index: number) => {
            const userColors = Object.values(usersRef.current).map((user: any) => user.color)
            const color = colors.length > 0 ? colors[index] : getRandomUniqueColor(userColors)

            acc[userId] = {
              ...color,
              ...existingUsers[userId],
            }

            return acc
          },
          {}
        )

        usersRef.current = updatedUsers
        return updatedUsers
      })
    }
  }

  // console.log('hello world')

  const signalRemotePeer = (remoteUser: string, channel: RealtimeChannel) => {
    const [initiator, _] = [currentUserId, remoteUser].sort()

    const peer = new SimplePeer({
      initiator: initiator === currentUserId,
      stream: currentUserStream,
    })

    console.log('currentUserStream', currentUserStream)
    // console.log('currentUserStream', currentUserStream?.addEventListener('mute'))

    // console.log(peer.streams)

    // peer.streams[0].addEventListener

    peer.streams[0].addEventListener(
      'mute',
      (event) => {
        // document.getElementById('timeline-widget').style.backgroundColor = '#aaa'
        console.log(remoteUser, 'mute event', event)
      },
      false
    )

    peer.streams[0].addEventListener(
      'unmute',
      (event) => {
        // document.getElementById('timeline-widget').style.backgroundColor = '#fff'
        console.log(remoteUser, 'unmute event', event)
      },
      false
    )

    peer.on('signal', (signal) => {
      channel.send({
        type: REALTIME_LISTEN_TYPES.BROADCAST,
        event: remoteUser,
        from: currentUserId,
        signal,
      })
    })

    peer.on('connect', () => {
      console.log('CONNECTED!')
    })

    peer.on('stream', (stream) => {
      const video = document.querySelector(`video[id="${remoteUser}"]`)

      if ('srcObject' in video!) {
        video.srcObject = stream
      } else {
        ;(video as HTMLVideoElement).src = URL.createObjectURL(stream as unknown as MediaSource)
      }

      usersRef.current[remoteUser] = {
        ...(usersRef.current[remoteUser] ?? {}),
        ...{ stream },
      }
      setUsers((existingUsers) => ({ ...existingUsers, ...usersRef.current }))
    })

    peer.on('close', () => {
      usersRef.current[remoteUser]?.remotePeer?.destroy()
    })

    peer.on('error', (err) => {
      console.log('Remote Peer Error: ', err)
      usersRef.current[remoteUser]?.remotePeer?.destroy()
    })

    usersRef.current[remoteUser] = { ...(usersRef.current[remoteUser] || {}), remotePeer: peer }

    setUsers((existingUsers) => ({ ...existingUsers, ...usersRef.current }))
  }

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then((stream) => {
        // console.log('stream in useeffect', stream.getAudioTracks()[0])
        stream.getAudioTracks()[0]?.addEventListener('mute', handleMuteEvent)
        stream.getAudioTracks()[0]?.addEventListener('unmute', handleMuteEvent)
        setCurrentUserStream(stream)
      })
      .catch((error) => {
        if (error.message === 'Permission denied') {
          window.alert('Please enable audio permissions then refresh this demo.')
          router.push('/')
        } else {
          router.push('/')
        }
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!currentUserStream) return
    const stream = currentUserStream
    stream.getAudioTracks()[0].enabled = mute ? false : true
    setCurrentUserStream(stream)
  }, [mute])

  // Define a handler function for mute events
  function handleMuteEvent(event) {
    console.log('handling mute event')
    const track = event.target // Get the media track that triggered the event

    if (track.kind === 'audio') {
      if (track.enabled) {
        // Audio track has been unmuted
        console.log('Audio unmuted:', track.id)
      } else {
        // Audio track has been muted
        console.log('Audio muted:', track.id)
      }
    } else if (track.kind === 'video') {
      if (track.enabled) {
        // Video track has been unmuted
        console.log('Video unmuted:', track.id)
      } else {
        // Video track has been muted
        console.log('Video muted:', track.id)
      }
    }
  }

  useEffect(() => {
    const adminChannel = supabaseClient.channel('admin')

    adminChannel
      .on(REALTIME_LISTEN_TYPES.PRESENCE, { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC }, () => {
        let newRoomId: string | undefined
        const state = adminChannel.presenceState()

        // User attempting to navigate directly to an existing room with users
        if (slugRoomId && slugRoomId in state && state[slugRoomId].length < MAX_ROOM_USERS) {
          newRoomId = slugRoomId
        }

        // User will be assigned an existing room with the fewest users
        if (!newRoomId) {
          const [mostVacantRoomId, users] =
            Object.entries(state).sort(([, a], [, b]) => a.length - b.length)[0] ?? []

          if (users && users.length < MAX_ROOM_USERS) {
            newRoomId = mostVacantRoomId
          } else {
            newRoomId = nanoid()
          }
        }

        /*
          Remove adminChannel so the topic can be used again in this component 
          to track users in a room.
        */
        supabaseClient.removeChannel(adminChannel).then(() => {
          setRoomId(newRoomId)
        })
      })
      .subscribe()

    return () => {
      supabaseClient.removeChannel(adminChannel)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!roomId) return

    // Listen to the 'admin' channel again because it was removed previously from the client
    const adminChannel = supabaseClient.channel('admin', { config: { presence: { key: roomId } } })
    adminChannel.on(
      REALTIME_LISTEN_TYPES.PRESENCE,
      { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
      () => {
        const state = adminChannel.presenceState<{ user_id: string }>()
        const isCurrentUserPresent = !!state[roomId]?.find((user) => user.user_id === currentUserId)

        if (isCurrentUserPresent) {
          router.push(`/${roomId}`)
        }
      }
    )
    adminChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        const resp: RealtimeChannelSendResponse = await adminChannel.track({
          user_id: currentUserId,
        })

        if (resp !== 'ok') {
          router.push(`/`)
        }
      }
    })

    return () => {
      supabaseClient.removeChannel(adminChannel)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useEffect(() => {
    if (!roomId) return

    const roomChannel = supabaseClient.channel(`room:${roomId}`, {
      config: { presence: { key: currentUserId } },
    })
    roomChannel
      .on(REALTIME_LISTEN_TYPES.PRESENCE, { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC }, () => {
        mapInitialUsers(roomChannel)
      })
      .on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.JOIN },
        ({ key }) => {
          if (key !== currentUserId && !usersRef.current[key]) {
            signalRemotePeer(key, roomChannel)
          }
        }
      )
      .on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.LEAVE },
        ({ key }) => {
          usersRef.current[key]?.remotePeer?.destroy()
          delete usersRef.current[key]
          setUsers((existingUsers) => ({ ...existingUsers, ...usersRef.current }))
        }
      )
      .on(REALTIME_LISTEN_TYPES.BROADCAST, { event: currentUserId }, ({ from, signal }) => {
        if (usersRef.current[from]?.remotePeer) {
          usersRef.current[from].remotePeer!.signal(signal)
        } else {
          signalRemotePeer(from, roomChannel)
        }
      })
    roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        const resp: RealtimeChannelSendResponse = await roomChannel.track({})

        if (resp !== 'ok') {
          router.push(`/`)
        }
      }
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  if (!roomId) {
    return <Loader />
  }

  return (
    <div className="h-screen w-screen bg-white">
      {Object.keys(users)
        .filter((userId) => userId !== currentUserId)
        .map((userId) => {
          return (
            <video
              className="absolute -z-50 left-0 top-0"
              key={userId}
              id={userId}
              autoPlay={
                // THIS WAS TURNED OFF
                false
              }
            />
          )
        })}
      <div className="w-full h-full flex flex-col gap-8 items-center justify-center">
        <div className="w-full flex flex-row items-center justify-center gap-3">
          {currentUserStream && users[currentUserId] ? (
            <div key={currentUserId} className="bg-gray-100 ring-2 ring-offset-1 rounded-lg">
              <AudioVisualizer
                key={currentUserId}
                user={{ ...users[currentUserId], stream: currentUserStream }}
              />
            </div>
          ) : null}
          {Object.entries(users)
            .filter(([userId, user]) => userId !== currentUserId && user.stream)
            .map(([userId, user]) => {
              return <AudioVisualizer key={userId} user={user} />
            })}
        </div>
        <div className="bg-slate-50 rounded-full p-3">
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setMute(!mute)}
              className={cn(
                mute ? 'bg-red-500' : 'bg-white',
                'border-slate-200',
                'hover:border-slate-300',
                'transition w-10 h-10 rounded-full  border hover:scale-[103%]',
                'flex',
                'justify-center items-center'
              )}
            >
              <Mic size={21} />
            </button>
            <button
              className={cn(
                'border-slate-200',
                'hover:border-slate-300',
                'transition w-10 h-10 rounded-full bg-white border hover:scale-[103%]',
                'flex',
                'justify-center items-center'
              )}
            >
              <MoreVertical size={21} />
            </button>
            <button
              className={cn(
                'bg-red-500',
                'hover:bg-red-600',
                'text-white',
                'transition w-10 h-10 rounded-full border hover:scale-[103%]',
                'flex',
                'justify-center items-center'
              )}
            >
              <Phone size={21} className={cn('rotate-[135deg]')} />
            </button>
          </div>
        </div>
        <div
          className="h-10 relative text-xs w-[440px] 
        bg-slate-50 p-3 py-1 rounded-full border border-slate-100 text-slate-500
        flex items-center
        "
        >
          <input
            value={'https://example.com' + router.asPath}
            className="w-full bg-transparent font-mono"
          />
          <button
            className="
          flex items-center gap-2
          text-xs h-8 px-3 top-50 bottom-50 absolute right-1 bg-white border border-slate-300 rounded-full"
          >
            <Copy size={12} />
            Copy URL
          </button>
        </div>
      </div>
    </div>
  )
}

export default Room
