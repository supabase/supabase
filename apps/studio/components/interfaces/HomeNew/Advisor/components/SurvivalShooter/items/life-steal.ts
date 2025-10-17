import type { GameItem } from './base'
import { WeaponType } from '../types'
import type { OnDamageContext, OnDamageResult } from '../events'

const LIFE_STEAL_PERCENT = 10

export const lifeSteal: GameItem = {
  id: 'life_steal',
  name: 'Life Steal',
  description: `+${LIFE_STEAL_PERCENT}% Life Steal`,
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
  eventHandlers: {
    onDamage: (context: OnDamageContext): OnDamageResult => {
      const healAmount = (context.damageDealt * LIFE_STEAL_PERCENT) / 100
      return { healAmount }
    },
  },
}
