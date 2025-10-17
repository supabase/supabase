import type { GameItem } from './base'
import { hpIncrease } from './hp-increase'
import { attackSpeed } from './attack-speed'
import { attackDamage } from './attack-damage'
import { lifeSteal } from './life-steal'
import { projectileCount } from './projectile-count'
import { projectileSize } from './projectile-size'
import { unlockRing } from './unlock-ring'
import { piercingDamage } from './piercing-damage'

// Export all items
export * from './base'
export * from './hp-increase'
export * from './attack-speed'
export * from './attack-damage'
export * from './life-steal'
export * from './projectile-count'
export * from './projectile-size'
export * from './unlock-ring'
export * from './piercing-damage'

// Item registry - all available items
export const ALL_ITEMS: GameItem[] = [
  hpIncrease,
  attackSpeed,
  attackDamage,
  lifeSteal,
  projectileCount,
  projectileSize,
  unlockRing,
  piercingDamage,
]

// Helper to get item by id
export function getItemById(id: string): GameItem | undefined {
  return ALL_ITEMS.find((item) => item.id === id)
}
