import type { GameItem } from './base'
import { WeaponType } from '../types'

export const projectileSize: GameItem = {
  id: 'projectile_size',
  name: 'Big Shot',
  description: '+50% Projectile Size',
  weaponModifiers: {
    projectileSizeMultiplier: 0.5, // +50%
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
}
