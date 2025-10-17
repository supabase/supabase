import type { GameItem } from './base'
import { defineItem } from './registry'

export const hpIncrease = defineItem({
  id: 'hp_increase',
  name: 'Health Potion',
  description: '+30 HP',
  statModifiers: {
    maxHp: 30,
  },
} satisfies GameItem)
