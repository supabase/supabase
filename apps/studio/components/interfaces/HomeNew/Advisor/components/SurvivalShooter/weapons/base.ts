import type { WeaponType, Vector2, Projectile, Player } from '../types'
import type { GameItem, WeaponModifiers } from '../items/base'
import type { EventHandlers } from '../events'

// Base weapon stats
export interface BaseWeaponStats {
  damage: number
  fireRate: number // attacks per second
  projectileCount: number
  projectileSpeed: number
}

// Weapon visuals
export interface WeaponVisuals {
  color: string
  size: number
  glowIntensity?: number
}

// Context for shooting
export interface ShootContext {
  player: Player
  currentTime: number
  weapon: {
    damage: number
    fireRate: number
    projectileCount: number
    projectileSpeed: number
    visualSize: number
  }
  config: {
    playerRadius: number
    projectileRadius: number
  }
  projectileIdCounter: { current: number }
}

// Result of shooting
export interface ShootResult {
  projectiles: Projectile[]
  lastFireTime: number
}

// Weapon definition
export interface GameWeapon {
  type: WeaponType
  name: string
  baseStats: BaseWeaponStats
  visuals: WeaponVisuals

  // Calculate final stats with applied items
  calculateStats: (appliedItems: GameItem[]) => BaseWeaponStats & { visuals: WeaponVisuals }

  // Shoot projectiles
  shoot: (
    context: ShootContext,
    lastFireTime: number,
    projectileAngles: number[]
  ) => ShootResult | null

  // Get event handlers from applied items
  getEventHandlers: (appliedItems: GameItem[]) => EventHandlers
}

// Helper to apply weapon modifiers
export function applyModifiers(
  baseStats: BaseWeaponStats,
  modifiers: WeaponModifiers
): BaseWeaponStats {
  return {
    damage: baseStats.damage * (1 + (modifiers.damageMultiplier || 0)),
    fireRate: baseStats.fireRate * (1 + (modifiers.fireRateMultiplier || 0)),
    projectileCount: baseStats.projectileCount + (modifiers.projectileCountBonus || 0),
    projectileSpeed: baseStats.projectileSpeed,
  }
}

// Helper to aggregate weapon modifiers from items
export function aggregateModifiers(items: GameItem[]): WeaponModifiers {
  const result: WeaponModifiers = {
    damageMultiplier: 0,
    fireRateMultiplier: 0,
    projectileCountBonus: 0,
    projectileSizeMultiplier: 0,
  }

  items.forEach((item) => {
    if (item.weaponModifiers) {
      result.damageMultiplier! += item.weaponModifiers.damageMultiplier || 0
      result.fireRateMultiplier! += item.weaponModifiers.fireRateMultiplier || 0
      result.projectileCountBonus! += item.weaponModifiers.projectileCountBonus || 0
      result.projectileSizeMultiplier! += item.weaponModifiers.projectileSizeMultiplier || 0
    }
  })

  return result
}

// Helper to aggregate event handlers from items
export function aggregateEventHandlers(items: GameItem[]): EventHandlers {
  const handlers: EventHandlers = {}

  items.forEach((item) => {
    if (item.eventHandlers) {
      // For now, we'll chain handlers (call all of them)
      // Could be more sophisticated later
      if (item.eventHandlers.onDamage) {
        const existingHandler = handlers.onDamage
        const newHandler = item.eventHandlers.onDamage
        handlers.onDamage = (context) => {
          const result1 = existingHandler ? existingHandler(context) : {}
          const result2 = newHandler(context)
          return {
            shouldRemoveProjectile:
              result2?.shouldRemoveProjectile ?? result1?.shouldRemoveProjectile,
            healAmount: (result1?.healAmount || 0) + (result2?.healAmount || 0),
            additionalDamage: (result1?.additionalDamage || 0) + (result2?.additionalDamage || 0),
          }
        }
      }
      if (item.eventHandlers.onEnemyDeath) {
        const existingHandler = handlers.onEnemyDeath
        const newHandler = item.eventHandlers.onEnemyDeath
        handlers.onEnemyDeath = (context) => {
          // Call existing handler first
          const result1 = existingHandler ? existingHandler(context) : {}
          // Then call new handler (allows items to affect enemies directly via context)
          const result2 = newHandler(context)
          // Aggregate only the return values (items handle their own side effects)
          return {
            healAmount: (result1?.healAmount || 0) + (result2?.healAmount || 0),
            spawnProjectiles: (result1?.spawnProjectiles || 0) + (result2?.spawnProjectiles || 0),
          }
        }
      }
      if (item.eventHandlers.onShoot) {
        const existingHandler = handlers.onShoot
        const newHandler = item.eventHandlers.onShoot
        handlers.onShoot = (context) => {
          existingHandler?.(context)
          newHandler(context)
        }
      }
    }
  })

  return handlers
}
