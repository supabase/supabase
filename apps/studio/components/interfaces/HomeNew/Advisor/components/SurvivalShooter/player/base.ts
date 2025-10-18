import type { Vector2, Player, Enemy } from '../types'
import type { GameItem } from '../items/base'
import type { EventHandlers } from '../events'
import type { GameEventBus } from '../events'

// Base player stats
export interface BasePlayerStats {
  maxHp: number
  currentHp: number
  moveSpeed: number // pixels per second
}

// Player modifiers that items can provide
export interface PlayerModifiers {
  moveSpeedMultiplier?: number // 0.25 = +25%
  hpRegenPerSecond?: number // flat regen per second
}

// Context for player update
export interface UpdatePlayerContext {
  player: Player
  deltaTime: number
  currentTime: number
  inputVector: Vector2 // normalized direction from input (-1 to 1)
  config: {
    canvasWidth: number
    canvasHeight: number
    playerRadius: number
  }
}

// Result of player update
export interface UpdatePlayerResult {
  position: Vector2
  rotation: number
}

// Context for player damage
export interface DamagePlayerContext {
  player: Player
  amount: number
  enemy?: Enemy
  currentTime: number
  events: GameEventBus
}

// Result of damage operation
export interface DamagePlayerResult {
  finalDamage: number
  reflectDamage: number
}

// Player definition interface
export interface GamePlayer {
  name: string
  baseStats: BasePlayerStats

  // Calculate final stats with applied items
  calculateStats: (appliedItems: GameItem[]) => BasePlayerStats

  // Update player state each frame
  update: (context: UpdatePlayerContext) => UpdatePlayerResult

  // Handle player taking damage
  damage: (context: DamagePlayerContext) => DamagePlayerResult

  // Heal the player
  heal: (player: Player, amount: number) => void

  // Get player radius (visual size based on stats)
  getRadius: (player: Player) => number

  // Get event handlers from applied items
  getEventHandlers: (appliedItems: GameItem[]) => EventHandlers
}

// Helper to apply player modifiers
export function applyPlayerModifiers(
  baseStats: BasePlayerStats,
  modifiers: PlayerModifiers
): BasePlayerStats {
  return {
    maxHp: baseStats.maxHp,
    currentHp: baseStats.currentHp,
    moveSpeed: baseStats.moveSpeed * (1 + (modifiers.moveSpeedMultiplier || 0)),
  }
}

// Helper to aggregate player modifiers from items
export function aggregatePlayerModifiers(items: GameItem[]): PlayerModifiers {
  const result: PlayerModifiers = {
    moveSpeedMultiplier: 0,
    hpRegenPerSecond: 0,
  }

  items.forEach((item) => {
    if (item.playerModifiers) {
      result.moveSpeedMultiplier! += item.playerModifiers.moveSpeedMultiplier || 0
      result.hpRegenPerSecond! += item.playerModifiers.hpRegenPerSecond || 0
    }
  })

  return result
}
