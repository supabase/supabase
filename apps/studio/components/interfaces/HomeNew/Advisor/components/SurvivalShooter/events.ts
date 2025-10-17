import type { Vector2, WeaponType, Projectile, Player, Enemy } from './types'

// Event contexts - rich state passed to event handlers
export interface OnDamageContext {
  weaponType: WeaponType
  damageDealt: number
  enemy: Enemy
  projectile: Projectile
  player: Player
  wasLethal: boolean
}

export interface OnEnemyDeathContext {
  enemy: Enemy
  player: Player
  projectile: Projectile
  weaponType: WeaponType
}

export interface OnShootContext {
  weaponType: WeaponType
  player: Player
  projectileCount: number
}

// Event handler return types
export interface OnDamageResult {
  shouldRemoveProjectile?: boolean
  healAmount?: number
  additionalDamage?: number
}

export interface OnEnemyDeathResult {
  healAmount?: number
  spawnProjectiles?: number
}

// Event handler function types
export type OnDamageHandler = (context: OnDamageContext) => OnDamageResult | void
export type OnEnemyDeathHandler = (context: OnEnemyDeathContext) => OnEnemyDeathResult | void
export type OnShootHandler = (context: OnShootContext) => void

// Event handlers that items can implement
export interface EventHandlers {
  onDamage?: OnDamageHandler
  onEnemyDeath?: OnEnemyDeathHandler
  onShoot?: OnShootHandler
}
