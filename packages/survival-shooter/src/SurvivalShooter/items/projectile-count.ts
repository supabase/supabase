import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const projectileCount = defineItem({
  id: 'projectile_count',
  name: 'Multishot',
  description: '+1 Projectile',
  weaponModifiers: {
    projectileCountBonus: 1,
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING, WeaponType.SHOTGUN, WeaponType.FLAMETHROWER],
} satisfies GameItem)
