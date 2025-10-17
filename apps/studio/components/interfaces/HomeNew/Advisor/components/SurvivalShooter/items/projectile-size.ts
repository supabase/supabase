import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const projectileSize = defineItem({
  id: 'projectile_size',
  name: 'Big Shot',
  description: '+50% Projectile Size',
  weaponModifiers: {
    projectileSizeMultiplier: 0.5, // +50%
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
} satisfies GameItem)
