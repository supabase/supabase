'use client'

import { useEffect, useRef, useState, useCallback, ReactElement } from 'react'
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_PRESENCE_LISTEN_EVENTS,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
} from '@supabase/supabase-js'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'
import { getColor } from './randomColor'
import { Coordinates, Payload, User } from './types'
import { cloneDeep, throttle } from 'lodash'
import Cursor from './Cursor'

export const GRID_SIZE = 100
export const CELL_SIZE = 40
export const CANVAS_WIDTH = 1800
export const CANVAS_HEIGHT = 1600
export const HOVER_DURATION = 100
export const FADE_DURATION = 300

const MAX_ROOM_USERS = 50
const MAX_EVENTS_PER_SECOND = 10
export const X_THRESHOLD = 25
export const Y_THRESHOLD = 65

interface CellState {
  isHovered: boolean
  fadeStartTime: number | null
  color: string
}

export const INTERACTIVE_GRID_COLORS = (isDark: boolean) => ({
  GRID_STROKE: isDark ? '#242424' : '#EDEDED',
  CURRENT_USER_HOVER: isDark ? '#00311D' : '#72E3AD',
})

// Generate a random user id
const userId = uuidv4()

export default function InteractiveGrid() {
  const { supabase, userData } = useConfData()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredCells, setHoveredCells] = useState<Map<string, CellState>>(new Map())
  const animationFrameRef = useRef<number>()

  // These states will be managed via ref as they're mutated within event listeners
  const usersRef = useRef<{ [key: string]: User }>({})
  const mousePositionRef = useRef<Coordinates>()

  const joinTimestampRef = useRef<number>()
  const [mousePosition, _setMousePosition] = useState<Coordinates>()

  const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
  const [roomId, setRoomId] = useState<undefined | string>(undefined)
  const [users, setUsers] = useState<{ [key: string]: User }>({})

  const setMousePosition = (coordinates: Coordinates) => {
    // if (!mousePositionRef.current) return
    mousePositionRef.current = coordinates
    _setMousePosition(coordinates)
  }

  const mapInitialUsers = (userChannel: RealtimeChannel, roomId: string) => {
    const state = userChannel.presenceState()
    const _users = state[roomId]

    if (!_users) return

    if (_users) {
      setUsers((existingUsers) => {
        const updatedUsers = _users.reduce(
          (acc: { [key: string]: User }, { user_id: userId }: any, index: number) => {
            acc[userId] = existingUsers[userId] || {
              x: 0,
              y: 0,
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

    if (!roomId) {
      joinTimestampRef.current = performance.now()

      /*
        Client is joining 'rooms' channel to examine existing rooms and their users
        and then the channel is removed once a room is selected
      */
      roomChannel = supabase?.channel('lw13_rooms')!

      roomChannel
        .on(REALTIME_LISTEN_TYPES.PRESENCE, { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC }, () => {
          let newRoomId
          const state = roomChannel.presenceState()

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
      roomChannel = supabase?.channel('lw13_rooms', { config: { presence: { key: roomId } } })!
      roomChannel.on(
        REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          setIsInitialStateSynced(true)
          mapInitialUsers(roomChannel, roomId)
        }
      )
      roomChannel.subscribe(async (status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED)
          await roomChannel.track({ user_id: userId })
      })
    }

    // Must properly remove subscribed channel
    return () => {
      roomChannel && supabase?.removeChannel(roomChannel)
    }
  }, [supabase, roomId])

  useEffect(() => {
    // if (!roomId || !isInitialStateSynced) return

    let messageChannel: RealtimeChannel
    let setMouseEvent: (e: MouseEvent) => void = () => {}

    messageChannel = supabase?.channel(`chat_messages:${roomId}`)!

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
                : payload?.payload?.y

            users[userId] = { ...existingUser, ...{ x, y } }
            users = cloneDeep(users)
          }

          return users
        })
      }
    )

    messageChannel?.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
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
        const top = window.pageYOffset || document.documentElement.scrollTop
        const [x, y] = [e.clientX, e.clientY - Y_THRESHOLD + top]
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          sendMouseBroadcast({ x, y })
        }
        setMousePosition({ x, y })
      }

      window.addEventListener('mousemove', setMouseEvent)
    })

    return () => {
      window.removeEventListener('mousemove', setMouseEvent)
      messageChannel && supabase?.removeChannel(messageChannel)
    }
  }, [roomId, isInitialStateSynced])

  const setCellHovered = useCallback((key: string, isHovered: boolean, color: string) => {
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

      return newState
    })
  }, [])

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, currentTime: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.lineWidth = 0.15
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
    },
    [hoveredCells, isDarkTheme]
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
      handleUserTrail(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    },
    [hoveredCells, setCellHovered, isDarkTheme]
  )

  const handleUserTrail = (
    xPos: number,
    yPos: number,
    color = INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
  ) => {
    const x = Math.floor(xPos / CELL_SIZE)
    const y = Math.floor(yPos / CELL_SIZE)

    const cellKey = `${x},${y}`

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      setCellHovered(cellKey, true, color)

      hoveredCells.forEach((_, key) => {
        if (key !== cellKey) {
          setCellHovered(key, false, color)
        }
      })
    }
  }

  const handleMouseLeave = useCallback(() => {
    hoveredCells.forEach((_, key) => {
      setCellHovered(key, false, INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER)
    })
  }, [hoveredCells, setCellHovered, userData])

  return (
    <div className="absolute inset-0 w-screen h-screen flex justify-center items-center max-w-screen max-h-screen">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="shadow-lg"
      />

      {/* Current user cursor */}
      {/* <Cursor
        key={userId}
        x={mousePosition?.x}
        y={mousePosition?.y}
        color={getColor('brand').bg}
        hue={getColor('brand').hue}
        message={''}
        isTyping={false}
        isCurrentUser={true}
      /> */}

      {/* Online users cursors */}
      {Object.entries(users).reduce((acc, [userId, data]) => {
        const { x, y, message, isTyping } = data
        if (x && y) {
          acc.push(
            <Cursor
              key={userId}
              x={x}
              y={y}
              color={getColor('gray').bg}
              hue={getColor('gray').hue}
              message={message || ''}
              isTyping={isTyping || false}
              isCurrentUser={false}
            />
          )
        }
        return acc
      }, [] as ReactElement[])}
    </div>
  )
}
