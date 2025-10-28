import { EnemyType } from '../types'
import type {
  GameEnemy,
  BaseEnemyStats,
  EnemyBehavior,
  EnemyRenderFunction,
} from './base'

// Faster, more aggressive enemy with moderate HP
export const eliteEnemy: GameEnemy = {
  type: EnemyType.ELITE,
  name: 'Elite Enemy',

  getStats: (waveNumber: number): BaseEnemyStats => {
    const baseHp = 35
    const baseSpeed = 60
    const baseDamage = 15
    const baseSize = 14

    return {
      hp: baseHp + waveNumber * 7,
      speed: baseSpeed + waveNumber * 3,
      damage: baseDamage + waveNumber * 3,
      size: baseSize,
    }
  },

  createBehavior: (): EnemyBehavior => {
    return (enemy, { deltaTime, runtime, currentTime }) => {
      const player = runtime.state.player
      const dx = player.position.x - enemy.position.x
      const dy = player.position.y - enemy.position.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      // Faster chase with slight zigzag pattern
      const time = currentTime / 1000
      const zigzag = Math.sin(time * 5) * 20 // Zigzag amplitude

      // Perpendicular direction for zigzag
      const perpX = -dy / distance
      const perpY = dx / distance

      enemy.velocity.x = (dx / distance) * enemy.speed + perpX * zigzag
      enemy.velocity.y = (dy / distance) * enemy.speed + perpY * zigzag

      enemy.position.x += enemy.velocity.x * deltaTime
      enemy.position.y += enemy.velocity.y * deltaTime

      // Check collision with player
      const playerRadius = runtime.getPlayerRadius()
      if (distance < playerRadius + enemy.size / 2) {
        runtime.damagePlayer(enemy.damage, enemy, currentTime)
        return false
      }

      return enemy.hp > 0
    }
  },

  createRenderer: (): EnemyRenderFunction => {
    return (enemy, { ctx, isDark }) => {
      const size = enemy.size
      const x = enemy.position.x - size / 2
      const y = enemy.position.y - size / 2

      // Enemy body - orange square
      ctx.fillStyle = isDark ? '#f97316' : '#ea580c'
      ctx.fillRect(x, y, size, size)

      // Add diagonal stripes for visual distinction
      ctx.strokeStyle = isDark ? '#fb923c' : '#f97316'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y + size * 0.3)
      ctx.lineTo(x + size * 0.3, y)
      ctx.moveTo(x, y + size * 0.7)
      ctx.lineTo(x + size * 0.7, y)
      ctx.moveTo(x + size * 0.3, y + size)
      ctx.lineTo(x + size, y + size * 0.3)
      ctx.moveTo(x + size * 0.7, y + size)
      ctx.lineTo(x + size, y + size * 0.7)
      ctx.stroke()

      // Enemy HP bar
      const hpBarWidth = size
      const hpBarHeight = 2
      const hpBarX = x
      const hpBarY = y - 4

      ctx.fillStyle = isDark ? '#333' : '#ddd'
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)

      const hpPercentage = enemy.hp / enemy.maxHp
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(
        hpBarX,
        hpBarY,
        hpBarWidth * hpPercentage,
        hpBarHeight
      )
    }
  },

  spawnWeight: 30, // Less common than normal
  experienceValue: 3,
}
