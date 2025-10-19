import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import type { GameState, GameConfig } from './types'
import { WeaponType } from './types'

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
      const { player, enemies, projectiles } = gameState

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

      // Draw enemies (squares)
      enemies.forEach((enemy) => {
        const size = config.enemySize
        const x = enemy.position.x - size / 2
        const y = enemy.position.y - size / 2

        // Enemy body
        ctx.fillStyle = isDark ? '#ef4444' : '#dc2626'
        ctx.fillRect(x, y, size, size)

        // Enemy HP bar
        const enemyHpBarWidth = size
        const enemyHpBarHeight = 2
        const enemyHpBarX = x
        const enemyHpBarY = y - 4

        ctx.fillStyle = isDark ? '#333' : '#ddd'
        ctx.fillRect(enemyHpBarX, enemyHpBarY, enemyHpBarWidth, enemyHpBarHeight)

        const enemyHpPercentage = enemy.hp / enemy.maxHp
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(
          enemyHpBarX,
          enemyHpBarY,
          enemyHpBarWidth * enemyHpPercentage,
          enemyHpBarHeight
        )
      })

      // Draw projectiles with weapon-specific colors
      projectiles.forEach((projectile) => {
        if (projectile.weaponType === WeaponType.RING) {
          // Draw ring as expanding ring
          ctx.strokeStyle = '#a78bfa' // purple
          ctx.lineWidth = 3
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.arc(player.position.x, player.position.y, projectile.radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
        } else if (projectile.weaponType === WeaponType.SHOTGUN) {
          // Draw shotgun as an arc segment
          ctx.strokeStyle = '#f97316' // orange
          ctx.lineWidth = 4
          ctx.globalAlpha = 0.7
          ctx.beginPath()

          // Arc angle is 60 degrees (PI/3), centered on projectile.angle
          const arcAngle = Math.PI / 3
          const startAngle = projectile.angle - arcAngle / 2
          const endAngle = projectile.angle + arcAngle / 2

          ctx.arc(
            projectile.position.x,
            projectile.position.y,
            projectile.radius,
            startAngle,
            endAngle
          )
          ctx.stroke()
          ctx.globalAlpha = 1
        } else if (projectile.weaponType === WeaponType.FLAMETHROWER) {
          // Draw flamethrower as a rotating line
          ctx.strokeStyle = '#fb923c' // orange
          ctx.lineWidth = 3
          ctx.globalAlpha = 0.8
          ctx.beginPath()

          const lineLength = projectile.radius
          const endX = projectile.position.x + Math.cos(projectile.angle) * lineLength
          const endY = projectile.position.y + Math.sin(projectile.angle) * lineLength

          ctx.moveTo(projectile.position.x, projectile.position.y)
          ctx.lineTo(endX, endY)
          ctx.stroke()
          ctx.globalAlpha = 1
        } else {
          // Draw normal projectiles (yellow)
          ctx.fillStyle = '#fbbf24' // yellow
          ctx.beginPath()
          ctx.arc(
            projectile.position.x,
            projectile.position.y,
            projectile.radius,
            0,
            Math.PI * 2
          )
          ctx.fill()
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
