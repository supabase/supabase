import { EnemyType } from '../types'
import type {
  GameEnemy,
  BaseEnemyStats,
  EnemyBehavior,
  EnemyRenderFunction,
} from './base'

// High HP, slow, powerful boss enemy
export const bossEnemy: GameEnemy = {
  type: EnemyType.BOSS,
  name: 'Boss Enemy',

  getStats: (waveNumber: number): BaseEnemyStats => {
    const baseHp = 250 // 10x more than normal
    const baseSpeed = 25 // Slower than normal
    const baseDamage = 25 // 2.5x normal
    const baseSize = 24 // 2x normal size

    return {
      hp: baseHp + waveNumber * 50, // Scales much faster
      speed: baseSpeed + waveNumber * 1, // Speed increases slowly
      damage: baseDamage + waveNumber * 5,
      size: baseSize,
    }
  },

  createBehavior: (): EnemyBehavior => {
    return (enemy, { deltaTime, runtime, currentTime }) => {
      const player = runtime.state.player
      const dx = player.position.x - enemy.position.x
      const dy = player.position.y - enemy.position.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      // Slow but relentless pursuit
      enemy.velocity.x = (dx / distance) * enemy.speed
      enemy.velocity.y = (dy / distance) * enemy.speed

      enemy.position.x += enemy.velocity.x * deltaTime
      enemy.position.y += enemy.velocity.y * deltaTime

      // Check collision with player
      const playerRadius = runtime.getPlayerRadius()
      if (distance < playerRadius + enemy.size / 2) {
        runtime.damagePlayer(enemy.damage, enemy, currentTime)
        // Boss doesn't die on collision - stays alive
        return true
      }

      return enemy.hp > 0
    }
  },

  createRenderer: (): EnemyRenderFunction => {
    return (enemy, { ctx, isDark, config }) => {
      const size = enemy.size
      const x = enemy.position.x - size / 2
      const y = enemy.position.y - size / 2

      // Boss body - purple/dark red square with border
      ctx.fillStyle = isDark ? '#a855f7' : '#9333ea'
      ctx.fillRect(x, y, size, size)

      // Add border to make it stand out
      ctx.strokeStyle = isDark ? '#c084fc' : '#a855f7'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, size, size)

      // Add inner cross pattern
      ctx.strokeStyle = isDark ? '#e9d5ff' : '#c084fc'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + size / 2, y)
      ctx.lineTo(x + size / 2, y + size)
      ctx.moveTo(x, y + size / 2)
      ctx.lineTo(x + size, y + size / 2)
      ctx.stroke()

      // Enemy HP bar - larger for boss
      const hpBarWidth = size
      const hpBarHeight = 4 // Thicker bar
      const hpBarX = x
      const hpBarY = y - 8 // More space above

      ctx.fillStyle = isDark ? '#333' : '#ddd'
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)

      const hpPercentage = enemy.hp / enemy.maxHp
      ctx.fillStyle = '#a855f7' // Purple health bar for boss
      ctx.fillRect(
        hpBarX,
        hpBarY,
        hpBarWidth * hpPercentage,
        hpBarHeight
      )

      // Add border to HP bar
      ctx.strokeStyle = isDark ? '#555' : '#999'
      ctx.lineWidth = 1
      ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)
    }
  },

  spawnWeight: 0, // Bosses don't spawn randomly - spawned manually
  experienceValue: 20, // High XP reward
}
