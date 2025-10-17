import type { GameItem } from './base'
import { WeaponType } from '../types'

export const projectileCount: GameItem = {
  id: 'projectile_count',
  name: 'Multishot',
  description: '+1 Projectile',
  weaponModifiers: {
    projectileCountBonus: 1,
  },
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
}
