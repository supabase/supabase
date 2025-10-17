import type { GameItem } from './base'

export const hpIncrease: GameItem = {
  id: 'hp_increase',
  name: 'Health Potion',
  description: '+30 HP',
  statModifiers: {
    maxHp: 30,
  },
}
