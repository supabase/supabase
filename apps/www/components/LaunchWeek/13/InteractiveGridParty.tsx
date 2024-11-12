'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'

const GRID_SIZE = 100
const CELL_SIZE = 40
const CANVAS_WIDTH = 1800
const CANVAS_HEIGHT = 1600
const HOVER_DURATION = 500
const FADE_DURATION = 300

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
  const [_onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [userColors, setUserColors] = useState<Record<string, string>>({})
  const animationFrameRef = useRef<number>()

  const currentUserIdRef = useRef(userData?.id || uuidv4())
  const CURRENT_USER_ID = currentUserIdRef.current

  const getUserColor = useCallback(
    (userId: string | undefined) => {
      if (!userId) {
        return INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
      }

      if (userColors[userId]) {
        return userColors[userId]
      }

      const colors = INTERACTIVE_GRID_COLORS(isDarkTheme).HOVER_COLORS
      const color = colors[userId.charCodeAt(0) % colors.length]

      setUserColors((prev) => ({ ...prev, [userId]: color }))
      return color
    },
    [userColors, isDarkTheme]
  )

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
        if (realtimeChannel) {
          realtimeChannel.send({
            type: 'broadcast',
            event: 'hover',
            payload: { cellKey: key, isHovered, color },
          })
        }

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

      Object.entries(userCursors).forEach(([userId, cursor]) => {
        ctx.fillStyle =
          userId === CURRENT_USER_ID
            ? INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER
            : getUserColor(userId)
        ctx.beginPath()
        ctx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI)
        ctx.fill()
      })
    },
    [hoveredCells, userCursors, getUserColor, isDarkTheme]
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
      const userColor = getUserColor(CURRENT_USER_ID)

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        setCellHovered(cellKey, true, userColor)

        hoveredCells.forEach((_, key) => {
          if (key !== cellKey) {
            setCellHovered(key, false, userColor)
          }
        })

        if (realtimeChannel) {
          realtimeChannel.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
              x: e.nativeEvent.offsetX,
              y: e.nativeEvent.offsetY,
              userId: CURRENT_USER_ID,
            },
          })
        }
      }
    },
    [hoveredCells, setCellHovered, realtimeChannel, getUserColor, isDarkTheme]
  )

  const handleMouseLeave = useCallback(() => {
    hoveredCells.forEach((_, key) => {
      setCellHovered(key, false, getUserColor(CURRENT_USER_ID))
    })
  }, [hoveredCells, setCellHovered, getUserColor, userData])

  useEffect(() => {
    if (!realtimeChannel && supabase) {
      const hoverChannel = supabase.channel('hover_presence', {
        config: { broadcast: { ack: true } },
      })

      setRealtimeChannel(hoverChannel)

      hoverChannel
        .on('broadcast', { event: 'hover' }, ({ payload }) => {
          setCellHovered(payload.cellKey, payload.isHovered, payload.color)
        })
        .on('broadcast', { event: 'cursor' }, ({ payload }) => {
          setUserCursors((prev) => ({
            ...prev,
            [payload.userId]: { x: payload.x, y: payload.y },
          }))
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') return
          hoverChannel.track({})
        })

      hoverChannel.on('presence', { event: 'sync' }, () => {
        const newState = hoverChannel.presenceState()
        setOnlineUsers(
          [...Object.entries(newState).map(([_, value]) => value[0])].filter(onlyUnique)
        )
      })
    }

    return () => {
      realtimeChannel?.unsubscribe()
    }
  }, [supabase, realtimeChannel])

  return (
    <div className="absolute inset-0 w-full h-full flex justify-center items-center max-h-full lg:max-h-screen">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="shadow-lg"
      />
    </div>
  )
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}
