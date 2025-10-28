import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import type { GameState, GameConfig } from './types'

interface SurvivalCanvasProps {
  gameStateRef: React.MutableRefObject<GameState | null>
  config: GameConfig
  onMouseMove?: (x: number, y: number) => void
  onResize?: (size: { width: number; height: number }) => void
}

export const SurvivalCanvas = ({ gameStateRef, config, onMouseMove, onResize }: SurvivalCanvasProps) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) {
      animationFrameId.current = requestAnimationFrame(draw)
      return
    }

    const width = canvas.width || config.canvasWidth
    const height = canvas.height || config.canvasHeight

    // Always clear the visible canvas so we can redraw with fresh state
    ctx.fillStyle = isDark ? '#0a0a0a' : '#fafafa'
    ctx.fillRect(0, 0, width, height)

    const gameState = gameStateRef.current
    if (gameState) {
      const { player, enemies, projectiles, experienceDrops } = gameState

      // Draw player (circle) - scale size with HP
      const baseRadius = 8
      const hpMultiplier = player.stats.maxHp / 100 // starts at 1.0 for 100hp
      const playerRadius = baseRadius * Math.sqrt(hpMultiplier) // use sqrt for more reasonable scaling

      ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb'
      ctx.beginPath()
      ctx.arc(player.position.x, player.position.y, playerRadius, 0, Math.PI * 2)
      ctx.fill()

      // Draw rotation indicator
      ctx.strokeStyle = isDark ? '#60a5fa' : '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(player.position.x, player.position.y)
      const indicatorLength = playerRadius + 6
      ctx.lineTo(
        player.position.x + Math.cos(player.rotation) * indicatorLength,
        player.position.y + Math.sin(player.rotation) * indicatorLength
      )
      ctx.stroke()

      // Draw player HP bar
      const hpBarWidth = playerRadius * 2
      const hpBarHeight = 3
      const hpBarX = player.position.x - playerRadius
      const hpBarY = player.position.y - playerRadius - 6

      // Background
      ctx.fillStyle = isDark ? '#333' : '#ddd'
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)

      // HP
      const hpPercentage = player.stats.currentHp / player.stats.maxHp
      ctx.fillStyle = hpPercentage > 0.5 ? '#22c55e' : hpPercentage > 0.25 ? '#eab308' : '#ef4444'
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercentage, hpBarHeight)

      // Draw experience drops (blue diamonds)
      experienceDrops.forEach((drop) => {
        const size = 6
        ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb' // blue
        ctx.beginPath()
        // Draw diamond shape (rotated square)
        ctx.save()
        ctx.translate(drop.position.x, drop.position.y)
        ctx.rotate(Math.PI / 4) // 45 degrees
        ctx.fillRect(-size / 2, -size / 2, size, size)
        ctx.restore()
      })

      // Draw enemies using their custom render functions
      enemies.forEach((enemy: any) => {
        if (enemy.render) {
          enemy.render(enemy, {
            ctx,
            playerPosition: player.position,
            isDark,
            config: {
              enemySize: config.enemySize,
            },
          })
        }
      })

      // Draw projectiles using their own render functions
      projectiles.forEach((projectile: any) => {
        // Call the projectile's render function if it exists
        if (projectile.render) {
          projectile.render(projectile, {
            ctx,
            playerPosition: player.position,
            isDark,
          })
        }
      })
    }

    animationFrameId.current = requestAnimationFrame(draw)
  }, [gameStateRef, config, isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return

      // Use getBoundingClientRect for accurate size including any CSS transforms
      const rect = parent.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)

      canvas.width = width
      canvas.height = height

      if (onResize) {
        onResize({ width, height })
      }
    }

    // Set initial canvas size
    resizeCanvas()

    // Start draw loop
    animationFrameId.current = requestAnimationFrame(draw)

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
    }
  }, [draw, onResize])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !onMouseMove) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    onMouseMove(x, y)
  }, [onMouseMove])

  return (
    <div className="w-full h-full bg-transparent">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        style={{ imageRendering: 'pixelated' }}
        onMouseMove={handleMouseMove}
      />
    </div>
  )
}
