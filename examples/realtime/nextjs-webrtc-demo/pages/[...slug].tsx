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

const MAX_ROOM_USERS = 5

const currentUserId = nanoid()

export interface User {
  color: string
  hue: string
  stream?: MediaStream
  remotePeer?: SimplePeer.Instance
}

const Room: NextPage = () => {
  const router = useRouter()
  const { slug } = router.query
  const slugRoomId: string | undefined = Array.isArray(slug) ? slug[0] : undefined

  const [roomId, setRoomId] = useState<string | undefined>(undefined)
  const [currentUserStream, setCurrentUserStream] = useState<MediaStream | undefined>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})

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
              ...{
                color: color.bg,
                hue: color.hue,
              },
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

  const signalRemotePeer = (remoteUser: string, channel: RealtimeChannel) => {
    const [initiator, _] = [currentUserId, remoteUser].sort()
    const peer = new SimplePeer({
      initiator: initiator === currentUserId,
      stream: currentUserStream,
    })

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
    <div
      className={[
        'h-screen w-screen p-4 flex flex-col justify-between relative',
        'max-h-screen max-w-screen overflow-hidden',
      ].join(' ')}
    >
      <div
        className="absolute h-full w-full left-0 top-0 pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundSize: '16px 16px',
          backgroundImage:
            'linear-gradient(to right, gray 1px, transparent 1px),\n    linear-gradient(to bottom, gray 1px, transparent 1px)',
        }}
      />
      <div className="flex flex-col h-full justify-between">
        {/* <div className="flex justify-between">
          <WaitlistPopover />
          <Users users={users} />
        </div> */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center space-x-2 pointer-events-none">
          {Object.keys(users)
            .filter((userId) => userId !== currentUserId)
            .map((userId) => {
              return <video key={userId} id={userId} autoPlay={true} />
            })}
          <div className="flex flex-col space-y-4">
            {Object.entries(users)
              .filter(([userId, user]) => userId !== currentUserId && user.stream)
              .map(([userId, user]) => {
                return <AudioVisualizer key={userId} user={user} />
              })}
          </div>
        </div>

        {currentUserStream && users[currentUserId] ? (
          <div key={currentUserId} className="absolute">
            <AudioVisualizer
              key={currentUserId}
              user={{ ...users[currentUserId], stream: currentUserStream }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Room
