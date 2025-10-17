import type { GameWeapon } from './base'
import type { WeaponType } from '../types'

class WeaponRegistry {
  private readonly weapons = new Map<WeaponType, GameWeapon>()

  register(weapon: GameWeapon) {
    this.weapons.set(weapon.type, weapon)
    return weapon
  }

  getAll(): GameWeapon[] {
    return Array.from(this.weapons.values())
  }

  getByType(type: WeaponType): GameWeapon | undefined {
    return this.weapons.get(type)
  }
}

export const weaponRegistry = new WeaponRegistry()

export function defineWeapon<T extends GameWeapon>(weapon: T): T {
  return weaponRegistry.register(weapon)
}
