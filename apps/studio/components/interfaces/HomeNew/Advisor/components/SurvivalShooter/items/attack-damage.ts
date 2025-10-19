import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const attackDamage = defineItem({
  id: 'attack_damage',
  name: 'Damage Boost',
  description: '+25% Damage',
  weaponModifiers: {
    damageMultiplier: 0.25, // +25%
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING, WeaponType.FLAMETHROWER],
} satisfies GameItem)
