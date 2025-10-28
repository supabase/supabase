import type { Enemy, EnemyType, Vector2 } from '../types'

// Forward declare GameRuntime to avoid circular dependency
export interface RuntimeContext {
  config: {
    canvasWidth: number
    canvasHeight: number
    playerRadius: number
    enemySize: number
  }
  state: {
    player: {
      position: Vector2
      stats: {
        currentHp: number
        maxHp: number
      }
    }
  }
  damagePlayer: (amount: number, enemy?: any, currentTime?: number) => void
  getPlayerRadius: () => number
}

// Enemy behavior update context
export interface EnemyUpdateContext {
  deltaTime: number
  currentTime: number
  runtime: RuntimeContext
}

// Enemy behavior function - returns true to keep enemy alive, false to remove
export type EnemyBehavior = (enemy: Enemy, ctx: EnemyUpdateContext) => boolean

// Enemy render context
export interface EnemyRenderContext {
  ctx: CanvasRenderingContext2D
  playerPosition: Vector2
  isDark: boolean
  config: {
    enemySize: number
  }
}

// Enemy render function
export type EnemyRenderFunction = (enemy: Enemy, renderCtx: EnemyRenderContext) => void

// Base enemy stats that scale with wave number
export interface BaseEnemyStats {
  hp: number
  speed: number
  damage: number
  size: number
}

// Enemy definition
export interface GameEnemy {
  type: EnemyType
  name: string

  // Calculate stats based on wave number
  getStats: (waveNumber: number) => BaseEnemyStats

  // Create behavior function for this enemy type
  createBehavior: () => EnemyBehavior

  // Create render function for this enemy type
  createRenderer: () => EnemyRenderFunction

  // Spawn weight (higher = more common)
  spawnWeight: number

  // Experience points dropped on death
  experienceValue: number
}
