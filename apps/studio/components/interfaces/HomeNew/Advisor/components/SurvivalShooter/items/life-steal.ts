import { WeaponType } from '../types'
import type { GameItem } from './base'
import type { OnDamageContext, OnDamageResult } from '../events'
import { defineItem } from './registry'

const LIFE_STEAL_PERCENT = 10
const APPLICABLE_WEAPONS = [WeaponType.NORMAL, WeaponType.RING, WeaponType.SHOTGUN, WeaponType.FLAMETHROWER]

export const lifeSteal = defineItem({
  id: 'life_steal',
  name: 'Life Steal',
  description: `+${LIFE_STEAL_PERCENT}% Life Steal (choose a weapon)`,
  requiresWeaponSelection: true,
  applicableWeaponTypes: APPLICABLE_WEAPONS,
  stackable: true,
  eventHandlers: {
    onDamage: (context: OnDamageContext): OnDamageResult => {
      // This handler is only called for the specific weapon type assigned during selection
      // The event bus system handles the weapon type filtering

      const healAmount = (context.damageDealt * LIFE_STEAL_PERCENT) / 100
      return { healAmount }
    },
  },
} satisfies GameItem)
