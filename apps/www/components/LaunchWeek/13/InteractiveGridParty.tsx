'use client'

import { useEffect, useRef, useState, useCallback, ReactElement } from 'react'
import {
  PostgrestResponse,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimeChannelSendResponse,
  RealtimePostgresInsertPayload,
  SupabaseClient,
} from '@supabase/supabase-js'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import {
  getColor,
  // getRandomColor,
  // getRandomColors,
  // getRandomUniqueColor,
} from './Multiplayer/randomColor'
import { Coordinates, Message, Payload, User } from './Multiplayer/types'
import { cloneDeep, throttle } from 'lodash'
import { Badge } from 'ui'
import Cursor from './Multiplayer/Cursor'
import Chatbox from './Multiplayer/Chatbox'

/**
 * [x] multiplayer cursors
 * [x] show own trail
 * [ ] share color between cursor and trails
 * [ ] show own cursor
 * [ ] abstract reusable setHoverTrail function
 * [ ] show other users cursors
 */

const GRID_SIZE = 100
const CELL_SIZE = 40
const CANVAS_WIDTH = 1800
const CANVAS_HEIGHT = 1600
const HOVER_DURATION = 100
const FADE_DURATION = 300

const LATENCY_THRESHOLD = 400
const MAX_ROOM_USERS = 50
const MAX_DISPLAY_MESSAGES = 50
const MAX_EVENTS_PER_SECOND = 10
const X_THRESHOLD = 25
const Y_THRESHOLD = 65

interface CellState {
  isHovered: boolean
  fadeStartTime: number | null
  color: string
}

interface CursorPosition {
  x: number
  y: number
}

export const INTERACTIVE_GRID_COLORS = (isDark: boolean) => ({
  GRID_STROKE: isDark ? '#242424' : '#EDEDED',
  CURRENT_USER_HOVER: isDark ? '#242424' : '#d3d3d3',
  // HOVER_COLORS: isDark ? ['#242424'] : ['#D3D3D3'],
  HOVER_COLORS: isDark
    ? ['#822A17', '#1F7A2F', '#172A82', '#520F57']
    : ['#FF8166', '#5CD671', '#6E86F7', '#F999FF'],
})

// Generate a random user id
const userId = uuidv4()

export default function InteractiveGrid() {
  const { supabase, userData } = useConfData()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [hoveredCells, setHoveredCells] = useState<Map<string, CellState>>(new Map())
  const [userCursors, setUserCursors] = useState<Record<string, CursorPosition>>({})
  // const [_onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [userColors, setUserColors] = useState<Record<string, string>>({})
  const animationFrameRef = useRef<number>()

  const currentUserIdRef = useRef(userData?.id || uuidv4())
  const CURRENT_USER_ID = currentUserIdRef.current

  const router = useRouter()

  const localColorBackup = getColor('gray')

  const chatboxRef = useRef<any>()
  // [Joshen] Super hacky fix for a really weird bug for onKeyDown
  // input field. For some reason the first keydown event appends the character twice
  const chatInputFix = useRef<boolean>(true)

  // These states will be managed via ref as they're mutated within event listeners
  const usersRef = useRef<{ [key: string]: User }>({})
  const isTypingRef = useRef<boolean>(false)
  const isCancelledRef = useRef<boolean>(false)
  const messageRef = useRef<string>()
  const messagesInTransitRef = useRef<string[]>()
  const mousePositionRef = useRef<Coordinates>()

  const joinTimestampRef = useRef<number>()
  const insertMsgTimestampRef = useRef<number>()

  // We manage the refs with a state so that the UI can re-render
  const [isTyping, _setIsTyping] = useState<boolean>(false)
  const [isCancelled, _setIsCancelled] = useState<boolean>(false)
  const [message, _setMessage] = useState<string>('')
  const [messagesInTransit, _setMessagesInTransit] = useState<string[]>([])
  const [mousePosition, _setMousePosition] = useState<Coordinates>()

  const [areMessagesFetched, setAreMessagesFetched] = useState<boolean>(false)
  const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
  const [latency, setLatency] = useState<number>(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomId, setRoomId] = useState<undefined | string>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})

  // const setIsTyping = (value: boolean) => {
  //   isTypingRef.current = value
  //   _setIsTyping(value)
  // }

  // const setIsCancelled = (value: boolean) => {
  //   isCancelledRef.current = value
  //   _setIsCancelled(value)
  // }

  const setMessage = (value: string) => {
    messageRef.current = value
    _setMessage(value)
  }

  const setMousePosition = (coordinates: Coordinates) => {
    mousePositionRef.current = coordinates
    _setMousePosition(coordinates)
  }

  // const setMessagesInTransit = (messages: string[]) => {
  //   messagesInTransitRef.current = messages
  //   _setMessagesInTransit(messages)
  // }

  const mapInitialUsers = (userChannel: RealtimeChannel, roomId: string) => {
    const state = userChannel.presenceState()
    const _users = state[roomId]

    if (!_users) return

    // Deconflict duplicate colours at the beginning of the browser session
    // const colors = Object.keys(usersRef.current).length === 0 ? getRandomColors(_users.length) : []

    if (_users) {
      setUsers((existingUsers) => {
        const updatedUsers = _users.reduce(
          (acc: { [key: string]: User }, { user_id: userId }: any, index: number) => {
            // const userColors = Object.values(usersRef.current).map((user: any) => user.color)
            // Deconflict duplicate colors for incoming clients during the browser session
            // const color = colors.length > 0 ? colors[index] : getRandomUniqueColor(userColors)

            acc[userId] = existingUsers[userId] || {
              x: 0,
              y: 0,
              // color: color.bg,
              // hue: color.hue,
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

  useEffect(() => {
    let roomChannel: RealtimeChannel

    const { slug } = router.query
    const slugRoomId = Array.isArray(slug) ? slug[0] : undefined

    if (!roomId) {
      // roomId is undefined when user first attempts to join a room

      joinTimestampRef.current = performance.now()

      /*
        Client is joining 'rooms' channel to examine existing rooms and their users
        and then the channel is removed once a room is selected
      */
      roomChannel = supabase?.channel('rooms')!

      roomChannel
        .on(REALTIME_LISTEN_TYPES.PRESENCE, { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC }, () => {
          let newRoomId
          const state = roomChannel.presenceState()

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
            }
          }

          // Generate an id if no existing rooms are available
          setRoomId(newRoomId ?? uuidv4())
        })
        .subscribe()
    } else {
      // When user has been placed in a room

      // joinTimestampRef.current &&
      //   sendLog(
      //     `User ${userId} joined Room ${roomId} in ${(
      //       performance.now() - joinTimestampRef.current
      //     ).toFixed(1)} ms`
      //   )

      /*
        Client is re-joining 'rooms' channel and the user's id will be tracked with Presence.

        Note: Realtime enforces unique channel names per client so the previous 'rooms' channel
        has already been removed in the cleanup function.
      */
      roomChannel = supabase?.channel('rooms', { config: { presence: { key: roomId } } })!
      roomChannel.on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          setIsInitialStateSynced(true)
          mapInitialUsers(roomChannel, roomId)
        }
      )
      roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          const resp: RealtimeChannelSendResponse = await roomChannel.track({ user_id: userId })

          // if (resp === 'ok') {
          //   router.push(`/${roomId}`)
          // } else {
          //   router.push(`/`)
          // }
        }
      })

      // Get the room's existing messages that were saved to database
      supabase
        ?.from('messages')
        .select('id, user_id, message')
        .filter('room_id', 'eq', roomId)
        .order('created_at', { ascending: false })
        .limit(MAX_DISPLAY_MESSAGES)
        .then((resp: PostgrestResponse<Message>) => {
          resp.data && setMessages(resp.data.reverse())
          setAreMessagesFetched(true)
          if (chatboxRef.current) chatboxRef.current.scrollIntoView({ behavior: 'smooth' })
        })
    }

    // Must properly remove subscribed channel
    return () => {
      roomChannel && supabase?.removeChannel(roomChannel)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, roomId])

  useEffect(() => {
    if (!roomId || !isInitialStateSynced) return

    // let pingIntervalId: ReturnType<typeof setInterval> | undefined
    let messageChannel: RealtimeChannel
    // , pingChannel: RealtimeChannel
    let setMouseEvent: (e: MouseEvent) => void = () => {}
    // onKeyDown: (e: KeyboardEvent) => void = () => {}

    // Ping channel is used to calculate roundtrip time from client to server to client
    // pingChannel = supabase?.channel(`ping:${userId}`, {
    //   config: { broadcast: { ack: true } },
    // })!
    // pingChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
    //   if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
    //     pingIntervalId = setInterval(async () => {
    //       const start = performance.now()
    //       const resp = await pingChannel.send({
    //         type: 'broadcast',
    //         event: 'PING',
    //         payload: {},
    //       })

    //       if (resp !== 'ok') {
    //         console.log('pingChannel broadcast error')
    //         setLatency(-1)
    //       } else {
    //         const end = performance.now()
    //         const newLatency = end - start

    //         // if (newLatency >= LATENCY_THRESHOLD) {
    //         //   sendLog(
    //         //     `Roundtrip Latency for User ${userId} surpassed ${LATENCY_THRESHOLD} ms at ${newLatency.toFixed(
    //         //       1
    //         //     )} ms`
    //         //   )
    //         // }

    //         setLatency(newLatency)
    //       }
    //     }, 1000)
    //   }
    // })

    messageChannel = supabase?.channel(`chat_messages:${roomId}`)!

    // // Listen for messages inserted into the database
    // messageChannel.on(
    //   REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
    //   {
    //     event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT,
    //     schema: 'public',
    //     table: 'messages',
    //     filter: `room_id=eq.${roomId}`,
    //   },
    //   (
    //     payload: RealtimePostgresInsertPayload<{
    //       id: number
    //       created_at: string
    //       message: string
    //       user_id: string
    //       room_id: string
    //     }>
    //   ) => {
    //     // if (payload.new.user_id === userId && insertMsgTimestampRef.current) {
    //     //   sendLog(
    //     //     `Message Latency for User ${userId} from insert to receive was ${(
    //     //       performance.now() - insertMsgTimestampRef.current
    //     //     ).toFixed(1)} ms`
    //     //   )
    //     //   insertMsgTimestampRef.current = undefined
    //     // }

    //     setMessages((prevMsgs: Message[]) => {
    //       const messages = prevMsgs.slice(-MAX_DISPLAY_MESSAGES + 1)
    //       const msg = (({ id, message, room_id, user_id }) => ({
    //         id,
    //         message,
    //         room_id,
    //         user_id,
    //       }))(payload.new)
    //       messages.push(msg)

    //       if (msg.user_id === userId) {
    //         const updatedMessagesInTransit = removeFirst(
    //           messagesInTransitRef?.current ?? [],
    //           msg.message
    //         )
    //         setMessagesInTransit(updatedMessagesInTransit)
    //       }

    //       return messages
    //     })

    //     if (chatboxRef.current) {
    //       chatboxRef.current.scrollIntoView({ behavior: 'smooth' })
    //     }
    //   }
    // )

    // Listen for cursor positions from other users in the room
    messageChannel.on(
      REALTIME_LISTEN_TYPES.BROADCAST,
      { event: 'POS' },
      (payload: Payload<{ user_id: string } & Coordinates>) => {
        setUsers((users) => {
          const userId = payload!.payload!.user_id
          const existingUser = users[userId]

          if (existingUser) {
            const x =
              (payload?.payload?.x ?? 0) - X_THRESHOLD > window.innerWidth
                ? window.innerWidth - X_THRESHOLD
                : payload?.payload?.x
            const y =
              (payload?.payload?.y ?? 0 - Y_THRESHOLD) > window.innerHeight
                ? window.innerHeight - Y_THRESHOLD
                : payload?.payload?.y! - Y_THRESHOLD

            users[userId] = { ...existingUser, ...{ x, y } }
            users = cloneDeep(users)
          }

          return users
        })
      }
    )

    // Listen for messages sent by other users directly via Broadcast
    // messageChannel.on(
    //   REALTIME_LISTEN_TYPES.BROADCAST,
    //   { event: 'MESSAGE' },
    //   (payload: Payload<{ user_id: string; isTyping: boolean; message: string }>) => {
    //     setUsers((users) => {
    //       const userId = payload!.payload!.user_id
    //       const existingUser = users[userId]

    //       if (existingUser) {
    //         users[userId] = {
    //           ...existingUser,
    //           ...{ isTyping: payload?.payload?.isTyping, message: payload?.payload?.message },
    //         }
    //         users = cloneDeep(users)
    //       }

    //       return users
    //     })
    //   }
    // )
    messageChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        // Lodash throttle will be removed once realtime-js client throttles on the channel level
        const sendMouseBroadcast = throttle(({ x, y }) => {
          messageChannel
            .send({
              type: 'broadcast',
              event: 'POS',
              payload: { user_id: userId, x, y },
            })
            .catch(() => {})
        }, 1000 / MAX_EVENTS_PER_SECOND)

        setMouseEvent = (e: MouseEvent) => {
          const [x, y] = [e.clientX, e.clientY]
          sendMouseBroadcast({ x, y })
          setMousePosition({ x, y })
        }

        // onKeyDown = async (e: KeyboardEvent) => {
        //   if (document.activeElement?.id === 'email') return

        //   // Start typing session
        //   if (e.code === 'Enter' || (e.key.length === 1 && !e.metaKey)) {
        //     if (!isTypingRef.current) {
        //       setIsTyping(true)
        //       setIsCancelled(false)

        //       if (chatInputFix.current) {
        //         setMessage('')
        //         chatInputFix.current = false
        //       } else {
        //         setMessage(e.key.length === 1 ? e.key : '')
        //       }
        //       messageChannel
        //         .send({
        //           type: 'broadcast',
        //           event: 'MESSAGE',
        //           payload: { user_id: userId, isTyping: true, message: '' },
        //         })
        //         .catch(() => {})
        //     } else if (e.code === 'Enter') {
        //       // End typing session and send message
        //       setIsTyping(false)
        //       messageChannel
        //         .send({
        //           type: 'broadcast',
        //           event: 'MESSAGE',
        //           payload: { user_id: userId, isTyping: false, message: messageRef.current },
        //         })
        //         .catch(() => {})
        //       if (messageRef.current) {
        //         const updatedMessagesInTransit = (messagesInTransitRef?.current ?? []).concat([
        //           messageRef.current,
        //         ])
        //         setMessagesInTransit(updatedMessagesInTransit)
        //         if (chatboxRef.current) chatboxRef.current.scrollIntoView({ behavior: 'smooth' })
        //         insertMsgTimestampRef.current = performance.now()
        //         await supabase?.from('messages').insert([
        //           {
        //             user_id: userId,
        //             room_id: roomId,
        //             message: messageRef.current,
        //           },
        //         ])
        //       }
        //     }
        //   }

        //   // End typing session without sending
        //   if (e.code === 'Escape' && isTypingRef.current) {
        //     setIsTyping(false)
        //     setIsCancelled(true)
        //     chatInputFix.current = true

        //     messageChannel
        //       .send({
        //         type: 'broadcast',
        //         event: 'MESSAGE',
        //         payload: { user_id: userId, isTyping: false, message: '' },
        //       })
        //       .catch(() => {})
        //   }
        // }

        window.addEventListener('mousemove', setMouseEvent)
        // window.addEventListener('keydown', onKeyDown)
      }
    })

    return () => {
      // pingIntervalId && clearInterval(pingIntervalId)

      window.removeEventListener('mousemove', setMouseEvent)
      // window.removeEventListener('keydown', onKeyDown)

      // pingChannel && supabase?.removeChannel(pingChannel)
      messageChannel && supabase?.removeChannel(messageChannel)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isInitialStateSynced])

  // const getUserColor = useCallback(
  //   (userId: string | undefined) => {
  //     if (!userId) {
  //       return INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
  //     }

  //     if (userColors[userId]) {
  //       return userColors[userId]
  //     }

  //     const colors = INTERACTIVE_GRID_COLORS(isDarkTheme).HOVER_COLORS
  //     const color = colors[userId.charCodeAt(0) % colors.length]

  //     setUserColors((prev) => ({ ...prev, [userId]: color }))
  //     return color
  //   },
  //   [userColors, isDarkTheme]
  // )

  const setCellHovered = useCallback(
    (key: string, isHovered: boolean, color: string) => {
      setHoveredCells((prev) => {
        const newState = new Map(prev)
        if (isHovered) {
          newState.set(key, { isHovered: true, fadeStartTime: null, color })
        } else {
          const existingCell = newState.get(key)
          if (existingCell && existingCell.isHovered) {
            newState.set(key, {
              isHovered: false,
              fadeStartTime: Date.now() + HOVER_DURATION,
              color,
            })
          }
        }

        // Broadcast hover state change to others
        // if (realtimeChannel) {
        //   realtimeChannel.send({
        //     type: 'broadcast',
        //     event: 'hover',
        //     payload: { cellKey: key, isHovered, color },
        //   })
        // }

        return newState
      })
    },
    [realtimeChannel]
  )

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, currentTime: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.lineWidth = 0.2
      ctx.strokeStyle = INTERACTIVE_GRID_COLORS(isDarkTheme).GRID_STROKE

      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const cellX = x * CELL_SIZE
          const cellY = y * CELL_SIZE

          ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE)

          const cellKey = `${x},${y}`
          const cellState = hoveredCells.get(cellKey)
          if (cellState) {
            let opacity = 0.5
            if (!cellState.isHovered && cellState.fadeStartTime) {
              const fadeElapsed = currentTime - cellState.fadeStartTime
              if (fadeElapsed >= 0) {
                opacity = Math.max(0, 0.5 * (1 - fadeElapsed / FADE_DURATION))
                if (opacity === 0) {
                  setHoveredCells((prev) => {
                    const newState = new Map(prev)
                    newState.delete(cellKey)
                    return newState
                  })
                }
              }
            }
            ctx.fillStyle = `rgba(${parseInt(cellState.color.slice(1, 3), 16)}, ${parseInt(cellState.color.slice(3, 5), 16)}, ${parseInt(cellState.color.slice(5, 7), 16)}, ${opacity})`
            ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE)
          }
        }
      }

      // Object.entries(userCursors).forEach(([userId, cursor]) => {
      //   ctx.fillStyle =
      //     userId === CURRENT_USER_ID
      //       ? INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
      //       : getUserColor(userId)
      //   ctx.beginPath()
      //   ctx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI)
      //   ctx.fill()
      // })
    },
    [hoveredCells, userCursors, isDarkTheme]
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentTime = Date.now()
    drawGrid(ctx, currentTime)

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [drawGrid])

  useEffect(() => {
    animate()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const x = Math.floor(e.nativeEvent.offsetX / CELL_SIZE)
      const y = Math.floor(e.nativeEvent.offsetY / CELL_SIZE)
      const cellKey = `${x},${y}`
      // const userColor = getUserColor(CURRENT_USER_ID)
      const userColor = INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        setCellHovered(cellKey, true, userColor)

        hoveredCells.forEach((_, key) => {
          if (key !== cellKey) {
            setCellHovered(key, false, userColor)
          }
        })

        // if (realtimeChannel) {
        //   realtimeChannel.send({
        //     type: 'broadcast',
        //     event: 'cursor',
        //     payload: {
        //       x: e.nativeEvent.offsetX,
        //       y: e.nativeEvent.offsetY,
        //       userId: CURRENT_USER_ID,
        //     },
        //   })
        // }
      }
    },
    [hoveredCells, setCellHovered, realtimeChannel, isDarkTheme]
  )

  const handleMouseLeave = useCallback(() => {
    hoveredCells.forEach((_, key) => {
      setCellHovered(key, false, INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER)
    })
  }, [hoveredCells, setCellHovered, userData])

  // useEffect(() => {
  //   if (!realtimeChannel && supabase) {
  //     const hoverChannel = supabase?.channel('hover_presence', {
  //       config: { broadcast: { ack: true } },
  //     })

  //     setRealtimeChannel(hoverChannel)

  //     hoverChannel
  //       .on('broadcast', { event: 'hover' }, ({ payload }) => {
  //         setCellHovered(payload.cellKey, payload.isHovered, payload.color)
  //       })
  //       .on('broadcast', { event: 'cursor' }, ({ payload }) => {
  //         setUserCursors((prev) => ({
  //           ...prev,
  //           [payload.userId]: { x: payload.x, y: payload.y },
  //         }))
  //       })
  //       .subscribe((status) => {
  //         if (status !== 'SUBSCRIBED') return
  //         hoverChannel.track({})
  //       })

  //     // hoverChannel.on('presence', { event: 'sync' }, () => {
  //     //   const newState = hoverChannel.presenceState()
  //     //   setOnlineUsers(
  //     //     [...Object.entries(newState).map(([_, value]) => value[0])].filter(onlyUnique)
  //     //   )
  //     // })
  //   }

  //   return () => {
  //     realtimeChannel?.unsubscribe()
  //   }
  // }, [supabase, realtimeChannel])

  console.log('users', users)

  return (
    <>
      <div className="absolute w-full !h-full inset-0 z-10 pointer-events-none">
        <div className="absolute left-4 bottom-4">
          <Badge>Latency: {latency.toFixed(1)}ms</Badge>
        </div>
        {/* <div className="absolute right-4 bottom-4">
          <Chatbox
            messages={messages || []}
            chatboxRef={chatboxRef}
            messagesInTransit={messagesInTransit}
            areMessagesFetched={areMessagesFetched}
          />
        </div> */}
      </div>
      <div className="absolute inset-0 w-screen h-screen flex justify-center items-center max-w-screen max-h-screen">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="shadow-lg"
        />

        {Object.entries(users).reduce((acc, [userId, data]) => {
          const { x, y, color, message, isTyping, hue } = data
          if (x && y) {
            acc.push(
              <Cursor
                key={userId}
                x={x}
                y={y}
                // color={color}
                // hue={hue}
                color={getColor('gray').bg}
                hue={getColor('gray').hue}
                message={message || ''}
                isTyping={isTyping || false}
              />
            )
          }
          return acc
        }, [] as ReactElement[])}

        {/* Cursor for local client: Shouldn't show the cursor itself, only the text bubble */}
        {Number.isInteger(mousePosition?.x) && Number.isInteger(mousePosition?.y) && (
          <Cursor
            isLocalClient
            x={mousePosition?.x}
            y={mousePosition?.y}
            color={users[userId]?.color ?? localColorBackup.bg}
            hue={users[userId]?.hue ?? localColorBackup.hue}
            isTyping={isTyping}
            isCancelled={isCancelled}
            message={message}
            onUpdateMessage={setMessage}
          />
        )}
      </div>
    </>
  )
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}

export const removeFirst = (src: any[], element: any) => {
  const index = src.indexOf(element)
  if (index === -1) return src
  return [...src.slice(0, index), ...src.slice(index + 1)]
}
