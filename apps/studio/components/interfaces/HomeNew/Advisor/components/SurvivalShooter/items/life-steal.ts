import { WeaponType } from '../types'
import type { GameItem } from './base'
import type { OnDamageContext, OnDamageResult } from '../events'
import { defineItem } from './registry'

const LIFE_STEAL_PERCENT = 10
const APPLICABLE_WEAPONS = [WeaponType.NORMAL, WeaponType.RING, WeaponType.SHOTGUN, WeaponType.FLAMETHROWER]

export const lifeSteal = defineItem({
  id: 'life_steal',
  name: 'Life Steal',
  description: `+${LIFE_STEAL_PERCENT}% Life Steal (applies to all weapons)`,
  requiresWeaponSelection: false, // Self-checks weapon type
  applicableWeaponTypes: APPLICABLE_WEAPONS,
  stackable: true,
  eventHandlers: {
    onDamage: (context: OnDamageContext): OnDamageResult => {
      // Check if this item applies to the weapon that dealt damage
      if (!APPLICABLE_WEAPONS.includes(context.weaponType)) {
        return {}
      }

      const healAmount = (context.damageDealt * LIFE_STEAL_PERCENT) / 100
      return { healAmount }
    },
  },
} satisfies GameItem)
