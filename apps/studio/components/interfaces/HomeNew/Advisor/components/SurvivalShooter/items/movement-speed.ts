import type { GameItem } from './base'
import { defineItem } from './registry'

export const movementSpeed = defineItem({
  id: 'movement_speed',
  name: 'Swift Boots',
  description: '+25% Movement Speed',
  playerModifiers: {
    moveSpeedMultiplier: 0.25, // +25% movement speed
  },
} satisfies GameItem)
