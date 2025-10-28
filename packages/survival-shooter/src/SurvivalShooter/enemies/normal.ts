import { EnemyType } from '../types'
import type {
  GameEnemy,
  BaseEnemyStats,
  EnemyBehavior,
  EnemyRenderFunction,
} from './base'

// Standard chaser enemy
export const normalEnemy: GameEnemy = {
  type: EnemyType.NORMAL,
  name: 'Normal Enemy',

  getStats: (waveNumber: number): BaseEnemyStats => {
    const baseHp = 20
    const baseSpeed = 40
    const baseDamage = 10
    const baseSize = 12

    return {
      hp: baseHp + waveNumber * 5,
      speed: baseSpeed + waveNumber * 2,
      damage: baseDamage + waveNumber * 2,
      size: baseSize,
    }
  },

  createBehavior: (): EnemyBehavior => {
    return (enemy, { deltaTime, runtime, currentTime }) => {
      const player = runtime.state.player
      const dx = player.position.x - enemy.position.x
      const dy = player.position.y - enemy.position.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      // Simple chase behavior
      enemy.velocity.x = (dx / distance) * enemy.speed
      enemy.velocity.y = (dy / distance) * enemy.speed

      enemy.position.x += enemy.velocity.x * deltaTime
      enemy.position.y += enemy.velocity.y * deltaTime

      // Check collision with player
      const playerRadius = runtime.getPlayerRadius()
      if (distance < playerRadius + enemy.size / 2) {
        runtime.damagePlayer(enemy.damage, enemy, currentTime)
        return false // Remove enemy after hitting player
      }

      return enemy.hp > 0
    }
  },

  createRenderer: (): EnemyRenderFunction => {
    return (enemy, { ctx, isDark }) => {
      const size = enemy.size
      const x = enemy.position.x - size / 2
      const y = enemy.position.y - size / 2

      // Enemy body - red square
      ctx.fillStyle = isDark ? '#ef4444' : '#dc2626'
      ctx.fillRect(x, y, size, size)

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

  spawnWeight: 100,
  experienceValue: 1,
}
