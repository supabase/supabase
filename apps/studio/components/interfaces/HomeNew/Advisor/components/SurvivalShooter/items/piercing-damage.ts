import type { GameItem } from './base'
import { WeaponType } from '../types'
import type { OnDamageContext, OnDamageResult } from '../events'

export const piercingDamage: GameItem = {
  id: 'piercing_damage',
  name: 'Piercing Damage',
  description: 'Projectiles pierce through enemies',
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL], // Only for normal weapon
  eventHandlers: {
    onDamage: (context: OnDamageContext): OnDamageResult => {
      // Don't remove the projectile on hit - let it pierce through
      return { shouldRemoveProjectile: false }
    },
  },
}
