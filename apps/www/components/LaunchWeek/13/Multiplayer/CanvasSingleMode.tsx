'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from 'next-themes'
import Cursor from './Cursor'
import { getColor } from './randomColor'
import { Coordinates } from './types'
import {
  HOVER_DURATION,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  CELL_SIZE,
  FADE_DURATION,
  Y_THRESHOLD,
} from './CanvasPartyMode'

interface CellState {
  isHovered: boolean
  fadeStartTime: number | null
  color: string
}

export default function InteractiveGridSingle() {
  const { supabase, userData } = useConfData()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredCells, setHoveredCells] = useState<Map<string, CellState>>(new Map())
  const [userColors, setUserColors] = useState<Record<string, string>>({})
  const animationFrameRef = useRef<number>()
  const [mousePosition, _setMousePosition] = useState<Coordinates>()
  const mousePositionRef = useRef<Coordinates>()

  const currentUserIdRef = useRef(userData?.id || uuidv4())
  const CURRENT_USER_ID = currentUserIdRef.current

  const setMousePosition = (coordinates: Coordinates) => {
    mousePositionRef.current = coordinates
    _setMousePosition(coordinates)
  }

  const INTERACTIVE_GRID_COLORS = (isDark: boolean) => ({
    GRID_STROKE: isDark ? '#242424' : '#EDEDED',
    CURRENT_USER_HOVER: isDark ? '#242424' : '#d3d3d3',
  })

  const getUserColor = useCallback(
    (userId: string | undefined) => {
      if (!userId) {
        return INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER // fallback color
      }

      if (userColors[userId]) {
        return userColors[userId]
      }

      const colors = [INTERACTIVE_GRID_COLORS(isDarkTheme).CURRENT_USER_HOVER]
      const color = colors[userId.charCodeAt(0) % colors.length]

      setUserColors((prev) => ({ ...prev, [userId]: color }))
      return color
    },
    [userColors]
  )

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
    [hoveredCells, getUserColor, isDarkTheme]
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
      }
    },
    [hoveredCells, setCellHovered, getUserColor]
  )

  const handleMouseLeave = useCallback(() => {
    hoveredCells.forEach((_, key) => {
      setCellHovered(key, false, getUserColor(CURRENT_USER_ID))
    })
  }, [hoveredCells, setCellHovered, getUserColor, userData])

  useEffect(() => {
    let setMouseEvent: (e: MouseEvent) => void = () => {}

    setMouseEvent = (e: MouseEvent) => {
      const top = window.pageYOffset || document.documentElement.scrollTop
      const [x, y] = [e.clientX, e.clientY - Y_THRESHOLD + top]
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', setMouseEvent)

    return () => {
      window.removeEventListener('mousemove', setMouseEvent)
    }
  }, [supabase])

  return (
    <div className="absolute inset-0 w-screen h-screen flex justify-center items-center max-w-screen max-h-screen">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="border border-gray-300 shadow-lg"
      />

      {/* Current user cursor */}
      {/* <Cursor
        x={mousePosition?.x}
        y={mousePosition?.y}
        color={getColor('brand').bg}
        hue={getColor('brand').hue}
        message={''}
        isTyping={false}
        isCurrentUser={true}
      /> */}
    </div>
  )
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}
