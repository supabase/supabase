/* eslint-disable @typescript-eslint/no-var-requires */
import type { GameWeapon } from './base'
import { WeaponType } from '../types'
import { weaponRegistry } from './registry'

// Export base types
export * from './base'

declare const require: {
  context: (path: string, includeSubdirectories: boolean, regExp: RegExp) => {
    keys: () => string[]
    <T>(id: string): T
  }
}

// Auto-register every weapon definition in this directory
const weaponContext =
  typeof require === 'function'
    ? require.context('./', false, /^(?!.*(?:index|base|registry)).*\.ts$/)
    : null

weaponContext?.keys().forEach((key) => {
  weaponContext(key)
})

export function getWeaponByType(type: WeaponType): GameWeapon {
  const weapon = weaponRegistry.getByType(type)
  if (!weapon) {
    throw new Error(`Weapon "${type}" is not registered`)
  }
  return weapon
}

export function getAllWeapons(): GameWeapon[] {
  return weaponRegistry.getAll()
}
