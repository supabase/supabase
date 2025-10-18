import type {
  GamePlayer,
  BasePlayerStats,
  UpdatePlayerContext,
  UpdatePlayerResult,
  DamagePlayerContext,
  DamagePlayerResult,
} from './base'
import { applyPlayerModifiers, aggregatePlayerModifiers } from './base'
import type { GameItem } from '../items/base'
import { aggregateEventHandlers } from '../weapons/base'

const PLAYER_BASE_RADIUS = 8

export const defaultPlayer: GamePlayer = {
  name: 'Default Player',

  baseStats: {
    maxHp: 100,
    currentHp: 100,
    moveSpeed: 150, // pixels per second
  },

  calculateStats: (appliedItems: GameItem[]): BasePlayerStats => {
    const playerModifiers = aggregatePlayerModifiers(appliedItems)
    const stats = applyPlayerModifiers(defaultPlayer.baseStats, playerModifiers)

    // Apply stat modifiers (maxHp bonuses from items)
    let maxHp = stats.maxHp
    appliedItems.forEach((item) => {
      if (item.statModifiers?.maxHp) {
        maxHp += item.statModifiers.maxHp
      }
    })

    return {
      ...stats,
      maxHp,
    }
  },

  update: (context: UpdatePlayerContext): UpdatePlayerResult => {
    const { player, deltaTime, inputVector, config } = context
    const stats = player.stats

    // Calculate new position based on input
    const moveSpeed = stats.moveSpeed
    const dx = inputVector.x * moveSpeed * deltaTime
    const dy = inputVector.y * moveSpeed * deltaTime

    let newX = player.position.x + dx
    let newY = player.position.y + dy

    // Clamp to canvas bounds
    const playerRadius = config.playerRadius
    newX = Math.max(playerRadius, Math.min(config.canvasWidth - playerRadius, newX))
    newY = Math.max(playerRadius, Math.min(config.canvasHeight - playerRadius, newY))

    return {
      position: { x: newX, y: newY },
      rotation: player.rotation, // rotation handled by mouse position separately
    }
  },

  damage: (context: DamagePlayerContext): DamagePlayerResult => {
    const { player, amount, enemy, currentTime, events } = context

    if (amount <= 0) {
      return { finalDamage: 0, reflectDamage: 0 }
    }

    // Emit player damaged event to get modifiers from items
    const damagedResult = events.emitPlayerDamaged({
      player,
      damageAmount: amount,
      enemy: enemy!,
      currentTime,
    })

    // Apply damage reduction
    let finalDamage = amount - damagedResult.damageReduction
    // Apply damage multiplier
    finalDamage = finalDamage * damagedResult.damageMultiplier

    // Clamp to 0 minimum
    finalDamage = Math.max(0, finalDamage)

    // Apply damage to player HP
    player.stats.currentHp = Math.max(0, player.stats.currentHp - finalDamage)

    return {
      finalDamage,
      reflectDamage: damagedResult.reflectDamage,
    }
  },

  heal: (player, amount) => {
    if (amount <= 0) return
    const { stats } = player
    stats.currentHp = Math.min(stats.maxHp, stats.currentHp + amount)
  },

  getRadius: (player) => {
    const maxHp = player.stats.maxHp
    const hpMultiplier = maxHp / 100
    return PLAYER_BASE_RADIUS * Math.sqrt(hpMultiplier)
  },

  getEventHandlers: (appliedItems: GameItem[]) => {
    // Aggregate event handlers from items that apply globally to the player
    return aggregateEventHandlers(appliedItems)
  },
}
