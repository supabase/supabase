import { EnemyType } from '../types'
import type { GameEnemy } from './base'
import { normalEnemy } from './normal'
import { eliteEnemy } from './elite'
import { bossEnemy } from './boss'

const enemyRegistry = new Map<EnemyType, GameEnemy>()

export function registerEnemy(enemy: GameEnemy) {
  enemyRegistry.set(enemy.type, enemy)
}

export function getEnemyByType(type: EnemyType): GameEnemy {
  const enemy = enemyRegistry.get(type)
  if (!enemy) {
    throw new Error(`Enemy type ${type} not registered`)
  }
  return enemy
}

export function getAllEnemies(): GameEnemy[] {
  return Array.from(enemyRegistry.values())
}

// Get a random enemy type based on spawn weights (excludes bosses)
export function getRandomEnemyType(): EnemyType {
  const spawnableEnemies = getAllEnemies().filter(e => e.spawnWeight > 0)
  const totalWeight = spawnableEnemies.reduce((sum, e) => sum + e.spawnWeight, 0)

  let random = Math.random() * totalWeight

  for (const enemy of spawnableEnemies) {
    random -= enemy.spawnWeight
    if (random <= 0) {
      return enemy.type
    }
  }

  // Fallback to normal
  return EnemyType.NORMAL
}

// Register all enemies
registerEnemy(normalEnemy)
registerEnemy(eliteEnemy)
registerEnemy(bossEnemy)
