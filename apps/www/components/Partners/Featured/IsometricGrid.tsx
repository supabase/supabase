'use client'

import { useEffect, useRef, useState } from 'react'

interface IsometricGridProps {
  partnerColor?: string
}

export function IsometricGrid({ partnerColor = '#FF9900' }: IsometricGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverTarget, setHoverTarget] = useState<{ x: number; y: number } | null>(null)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingHoverRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    const gridSize = 40
    const cols = Math.ceil(canvas.offsetWidth / gridSize) + 2
    const rows = Math.ceil(canvas.offsetHeight / gridSize) + 2

    interface Path {
      x: number
      y: number
      targetX: number
      targetY: number
      color: string
      trail: { x: number; y: number }[]
      direction: { dx: number; dy: number }
      horizontalSteps: number
      mode: 'normal' | 'attracted' | 'circling'
      circleStep: number
    }

    const createPath = (x: number, startY: number, color: string): Path => ({
      x: x * gridSize,
      y: startY * gridSize,
      targetX: x * gridSize,
      targetY: (startY + 1) * gridSize,
      color,
      trail: [],
      direction: { dx: 0, dy: 1 },
      horizontalSteps: 0,
      mode: 'normal',
      circleStep: 0,
    })

    const paths: Path[] = [
      createPath(Math.floor(cols * 0.45), 0, '#3ECF8E'),
      createPath(Math.floor(cols * 0.55), 0, partnerColor),
    ]

    // Circle pattern around a point (clockwise)
    const circlePattern = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: -1 },
    ]

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      // Draw grid - different color for light/dark mode
      const theme = document.documentElement.getAttribute('data-theme')
      const isDark = theme === 'dark' || theme?.includes('dark')
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 0.5

      for (let x = 0; x <= cols; x++) {
        ctx.beginPath()
        ctx.moveTo(x * gridSize, 0)
        ctx.lineTo(x * gridSize, rows * gridSize)
        ctx.stroke()
      }

      for (let y = 0; y <= rows; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * gridSize)
        ctx.lineTo(cols * gridSize, y * gridSize)
        ctx.stroke()
      }

      // Draw animated paths
      const maxY = rows * gridSize
      const fadeStartY = maxY * 0.7

      paths.forEach((path) => {
        const bottomFade = path.y > fadeStartY ? 1 - (path.y - fadeStartY) / (maxY - fadeStartY) : 1

        if (path.trail.length > 1) {
          for (let i = 1; i < path.trail.length; i++) {
            const prev = path.trail[i - 1]
            const curr = path.trail[i]

            const trailAlpha = i / path.trail.length
            const alpha = trailAlpha * bottomFade

            ctx.beginPath()
            ctx.strokeStyle = path.color
            ctx.lineWidth = 1.5
            ctx.lineCap = 'round'
            ctx.globalAlpha = alpha

            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(curr.x, curr.y)
            ctx.stroke()
          }

          if (path.trail.length > 0) {
            const last = path.trail[path.trail.length - 1]
            ctx.beginPath()
            ctx.strokeStyle = path.color
            ctx.lineWidth = 1.5
            ctx.lineCap = 'round'
            ctx.globalAlpha = bottomFade

            ctx.moveTo(last.x, last.y)
            ctx.lineTo(path.x, path.y)
            ctx.stroke()
          }

          ctx.globalAlpha = 1
        }
      })
    }

    const updatePaths = (target: { x: number; y: number } | null) => {
      paths.forEach((path) => {
        const speed = 5
        const dx = path.targetX - path.x
        const dy = path.targetY - path.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < speed) {
          path.x = path.targetX
          path.y = path.targetY

          path.trail.push({ x: path.x, y: path.y })
          if (path.trail.length > 15) path.trail.shift()

          // Check if we should be attracted to hover target
          if (target && path.mode === 'normal' && path.y < target.y) {
            // Path is above the target - get attracted
            path.mode = 'attracted'
          }

          if (path.mode === 'attracted' && target) {
            // Move towards the target
            const toTargetX = target.x - path.x
            const toTargetY = target.y - path.y

            if (Math.abs(toTargetX) < gridSize && Math.abs(toTargetY) < gridSize) {
              // Reached target, start circling
              path.mode = 'circling'
              path.circleStep = 0
              path.x = target.x
              path.y = target.y
            } else {
              // Move towards target
              if (Math.abs(toTargetX) > Math.abs(toTargetY)) {
                path.direction = { dx: toTargetX > 0 ? 1 : -1, dy: 0 }
              } else {
                path.direction = { dx: 0, dy: toTargetY > 0 ? 1 : -1 }
              }
            }
          } else if (path.mode === 'circling' && target) {
            // Circle around the target
            path.direction = circlePattern[path.circleStep % 4]
            path.circleStep++

            // After a few circles, check if target is still active
            if (path.circleStep > 12) {
              path.mode = 'normal'
              path.direction = { dx: 0, dy: 1 }
            }
          } else {
            // Normal movement - reset mode if no target
            if (!target) {
              path.mode = 'normal'
            }

            const isHorizontal = path.direction.dx !== 0
            if (isHorizontal) {
              path.horizontalSteps++
            } else {
              path.horizontalSteps = 0
            }

            const turnChance = Math.random()
            const mustTurnDown = path.horizontalSteps >= 3

            if (mustTurnDown) {
              path.direction = { dx: 0, dy: 1 }
              path.horizontalSteps = 0
            } else if (turnChance < 0.88) {
              // Continue
            } else {
              const turns = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: 1 },
              ]
              path.direction = turns[Math.floor(Math.random() * turns.length)]
            }
          }

          path.targetX = path.x + path.direction.dx * gridSize
          path.targetY = path.y + path.direction.dy * gridSize

          if (path.targetX < 0) {
            path.targetX = gridSize
            path.direction = { dx: 1, dy: 0 }
          }
          if (path.targetX > cols * gridSize) {
            path.targetX = (cols - 1) * gridSize
            path.direction = { dx: -1, dy: 0 }
          }

          if (path.targetY > rows * gridSize) {
            const centerX = Math.floor(cols * 0.4 + Math.random() * cols * 0.2)
            path.x = centerX * gridSize
            path.y = 0
            path.targetX = path.x
            path.targetY = gridSize
            path.trail = []
            path.direction = { dx: 0, dy: 1 }
            path.mode = 'normal'
          }
        } else {
          path.x += (dx / dist) * speed
          path.y += (dy / dist) * speed
        }
      })
    }

    let animationId: number
    let currentTarget: { x: number; y: number } | null = null

    const animate = () => {
      updatePaths(currentTarget)
      drawGrid()
      animationId = requestAnimationFrame(animate)
    }

    // Handle hover - convert screen coords to grid coords
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      // Account for perspective transform - approximate
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top

      // Convert to grid coordinates (rough approximation due to perspective)
      const gridX = Math.floor((relX / rect.width) * cols) * gridSize
      const gridY = Math.floor((relY / rect.height) * rows * 0.5) * gridSize

      pendingHoverRef.current = { x: gridX, y: gridY }

      // Start timer if not already running
      if (!hoverTimerRef.current) {
        hoverTimerRef.current = setTimeout(() => {
          if (pendingHoverRef.current) {
            currentTarget = pendingHoverRef.current
            setHoverTarget(pendingHoverRef.current)
          }
        }, 500) // 500ms hover delay
      }
    }

    const handleMouseLeave = () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      pendingHoverRef.current = null
      currentTarget = null
      setHoverTarget(null)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationId)
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [partnerColor])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 ![perspective:1000px] pointer-events-none">
        <div
          className="absolute inset-0 w-[200%] h-[200%] -left-1/2 -top-1/2"
          style={{ transform: 'rotateX(75deg)' }}
        >
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  )
}
