import type { GameItem } from './base'
import { WeaponType } from '../types'

export const attackSpeed: GameItem = {
  id: 'attack_speed',
  name: 'Attack Speed',
  description: '+25% Attack Speed',
  weaponModifiers: {
    fireRateMultiplier: 0.25, // +25%
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
}
