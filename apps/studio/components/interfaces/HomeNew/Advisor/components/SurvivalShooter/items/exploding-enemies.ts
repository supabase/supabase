import { WeaponType } from '../types'
import type { OnEnemyDeathContext, OnEnemyDeathResult } from '../events'
import type { GameItem } from './base'
import { defineItem } from './registry'

const EXPLOSION_DAMAGE_PER_STACK = 2
const EXPLOSION_INITIAL_RADIUS = 3 // Start small, each stack adds another explosion
const EXPLOSION_MAX_AGE = 0.3 // seconds - short burst

export const explodingEnemies = defineItem({
  id: 'exploding_enemies',
  name: 'Exploding Enemies',
  description: 'Enemies explode on death (stacks for bigger radius)',
  requiresWeaponSelection: true,
  applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
  stackable: true,
  eventHandlers: {
    onEnemyDeath: (context: OnEnemyDeathContext): OnEnemyDeathResult => {
      const { enemy, weaponType, currentTime, spawnProjectile } = context

      spawnProjectile({
        position: { x: enemy.position.x, y: enemy.position.y },
        velocity: { x: 0, y: 0 },
        angle: 0,
        damage: EXPLOSION_DAMAGE_PER_STACK,
        radius: EXPLOSION_INITIAL_RADIUS,
        weaponType, // Keep original weapon type for chaining
        isPulse: true, // Makes it expand like ring weapon
        createdAt: currentTime,
        initialRadius: EXPLOSION_INITIAL_RADIUS,
        maxAge: EXPLOSION_MAX_AGE,
      })

      return {}
    },
  },
} satisfies GameItem)
