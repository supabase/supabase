import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const attackSpeed = defineItem({
  id: 'attack_speed',
  name: 'Attack Speed',
  description: '+25% Attack Speed',
  weaponModifiers: {
    fireRateMultiplier: 0.25, // +25%
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING, WeaponType.FLAMETHROWER],
} satisfies GameItem)
