import { WeaponType } from '../types'
import type {
  OnEnemyDeathContext,
  OnEnemyDeathResult,
  ProjectileRenderFunction,
  ProjectileBehaviorFunction,
} from '../events'
import type { GameItem } from './base'
import { defineItem } from './registry'

const EXPLOSION_DAMAGE_PER_STACK = 2
const EXPLOSION_INITIAL_RADIUS = 3 // Start small, each stack adds another explosion
const EXPLOSION_MAX_AGE = 0.3 // seconds - short burst
const EXPLOSION_EXPANSION_SPEED = 200 // faster than ring weapon
const EXPLOSION_THICKNESS = 15

// Explosion renderer: orange expanding ring at explosion location
const createExplosionRenderer = (): ProjectileRenderFunction => {
  return (projectile, { ctx }) => {
    ctx.strokeStyle = '#f97316' // orange
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

// Explosion behavior: expands and damages enemies, stays at spawn location
const createExplosionBehavior = (): ProjectileBehaviorFunction => {
  return (projectile, { currentTime, runtime }) => {
    const startTime = projectile.createdAt ?? currentTime
    const ageSeconds = (currentTime - startTime) / 1000
    const initialRadius = projectile.initialRadius ?? 3

    // Expand the explosion over time
    projectile.radius = initialRadius + ageSeconds * EXPLOSION_EXPANSION_SPEED

    const maxAge = projectile.maxAge ?? EXPLOSION_MAX_AGE

    // Remove if too old
    if (ageSeconds > maxAge) {
      return false
    }

    // Check collision with enemies along the ring edge
    const enemies = runtime.state.enemies
    const explosionCenter = projectile.position

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      const dx = enemy.position.x - explosionCenter.x
      const dy = enemy.position.y - explosionCenter.y
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

      const isColliding =
        Math.abs(distanceFromCenter - projectile.radius) <
        EXPLOSION_THICKNESS + runtime.config.enemySize / 2

      if (!isColliding) continue

      runtime.handleProjectileHit(enemy, projectile, currentTime, false)
    }

    return true
  }
}

const APPLICABLE_WEAPONS = [WeaponType.NORMAL, WeaponType.RING, WeaponType.SHOTGUN, WeaponType.FLAMETHROWER]

export const explodingEnemies = defineItem({
  id: 'exploding_enemies',
  name: 'Exploding Enemies',
  description: 'Enemies explode on death (choose a weapon)',
  requiresWeaponSelection: true,
  applicableWeaponTypes: APPLICABLE_WEAPONS,
  stackable: true,
  eventHandlers: {
    onEnemyDeath: (context: OnEnemyDeathContext): OnEnemyDeathResult => {
      const { enemy, weaponType, currentTime, spawnProjectile } = context

      // This handler is only called for the specific weapon type assigned during selection
      // The event bus system handles the weapon type filtering

      // Spawn explosion at enemy death location
      spawnProjectile({
        position: { x: enemy.position.x, y: enemy.position.y },
        velocity: { x: 0, y: 0 },
        angle: 0,
        damage: EXPLOSION_DAMAGE_PER_STACK,
        radius: EXPLOSION_INITIAL_RADIUS,
        weaponType, // Keep original weapon type for chaining
        isPulse: true, // Mark as pulse for semantic meaning
        createdAt: currentTime,
        initialRadius: EXPLOSION_INITIAL_RADIUS,
        maxAge: EXPLOSION_MAX_AGE,
        render: createExplosionRenderer(),
        behavior: createExplosionBehavior(),
      })

      return {}
    },
  },
} satisfies GameItem)
