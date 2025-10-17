import type { GameWeapon } from './base'
import { normalWeapon } from './normal'
import { ringWeapon } from './ring'
import { WeaponType } from '../types'

// Export all weapons
export * from './base'
export * from './normal'
export * from './ring'

// Weapon registry - all available weapons
export const WEAPON_REGISTRY: Record<WeaponType, GameWeapon> = {
  [WeaponType.NORMAL]: normalWeapon,
  [WeaponType.RING]: ringWeapon,
}

// Helper to get weapon by type
export function getWeaponByType(type: WeaponType): GameWeapon {
  return WEAPON_REGISTRY[type]
}
