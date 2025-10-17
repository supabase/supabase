import type { WeaponType } from '../types'
import type { EventHandlers } from '../events'

// Stat modifiers that items can provide
export interface StatModifiers {
  maxHp?: number // flat bonus
}

// Weapon modifiers that items can provide
export interface WeaponModifiers {
  damageMultiplier?: number // 0.25 = +25%
  fireRateMultiplier?: number // 0.25 = +25%
  projectileCountBonus?: number // flat bonus (e.g., +1)
  projectileSizeMultiplier?: number // 0.5 = +50%
}

// Base item definition
export interface GameItem {
  id: string
  name: string
  description: string

  // Stat modifiers (applied to player)
  statModifiers?: StatModifiers

  // Weapon modifiers (applied to specific weapon or all weapons)
  weaponModifiers?: WeaponModifiers

  // Event handlers
  eventHandlers?: EventHandlers

  // Weapon requirements
  requiresWeaponSelection?: boolean
  applicableWeaponTypes?: WeaponType[]

  // Unlocks
  unlocksWeapon?: WeaponType

  // Can this item be selected multiple times?
  stackable?: boolean // defaults to true
}

// Helper to check if an item can be applied to a weapon
export function canApplyToWeapon(item: GameItem, weaponType: WeaponType): boolean {
  if (!item.requiresWeaponSelection) return true
  if (!item.applicableWeaponTypes) return false
  return item.applicableWeaponTypes.includes(weaponType)
}
