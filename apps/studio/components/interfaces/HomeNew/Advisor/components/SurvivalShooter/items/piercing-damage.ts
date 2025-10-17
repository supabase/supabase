import { WeaponType } from '../types'
import type { GameItem } from './base'
import type { OnDamageContext, OnDamageResult } from '../events'
import { defineItem } from './registry'

export const piercingDamage = defineItem({
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
} satisfies GameItem)
