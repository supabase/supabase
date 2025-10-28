import { WeaponType } from '../types'
import type { GameItem } from './base'
import type { OnDamageContext, OnDamageResult } from '../events'
import { defineItem } from './registry'

const APPLICABLE_WEAPONS = [WeaponType.NORMAL] // Only for normal weapon

export const piercingDamage = defineItem({
  id: 'piercing_damage',
  name: 'Piercing Damage',
  description: 'Blaster projectiles pierce through enemies',
  requiresWeaponSelection: false, // Self-checks weapon type
  applicableWeaponTypes: APPLICABLE_WEAPONS,
  stackable: false,
  eventHandlers: {
    onDamage: (context: OnDamageContext): OnDamageResult => {
      // Check if this item applies to the weapon that dealt damage
      if (!APPLICABLE_WEAPONS.includes(context.weaponType)) {
        return {}
      }

      // Don't remove the projectile on hit - let it pierce through
      return { shouldRemoveProjectile: false }
    },
  },
} satisfies GameItem)
