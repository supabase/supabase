import type { GameItem } from './base'
import { WeaponType } from '../types'

export const attackDamage: GameItem = {
  id: 'attack_damage',
  name: 'Damage Boost',
  description: '+25% Damage',
  weaponModifiers: {
    damageMultiplier: 0.25, // +25%
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
}
