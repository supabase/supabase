import type { GameWeapon, ShootContext, ShootResult, ProjectileBehavior } from './base'
import { applyModifiers, aggregateModifiers, aggregateEventHandlers } from './base'
import type { Vector2, Projectile } from '../types'
import type { GameItem } from '../items/base'
import { WeaponType } from '../types'
import { defineWeapon } from './registry'

// Helper: Find the biggest gap between angles and return the angle in the middle
function findBiggestGap(angles: number[]): number {
  if (angles.length === 0) return 0
  if (angles.length === 1) return (angles[0] + Math.PI) % (Math.PI * 2)

  const sorted = [...angles].sort((a, b) => a - b)
  let maxGap = 0
  let maxGapIndex = 0

  for (let i = 0; i < sorted.length; i++) {
    const nextIndex = (i + 1) % sorted.length
    const gap =
      nextIndex === 0 ? Math.PI * 2 - sorted[i] + sorted[0] : sorted[nextIndex] - sorted[i]

    if (gap > maxGap) {
      maxGap = gap
      maxGapIndex = i
    }
  }

  const nextIndex = (maxGapIndex + 1) % sorted.length
  if (nextIndex === 0) {
    return (sorted[maxGapIndex] + maxGap / 2) % (Math.PI * 2)
  } else {
    return sorted[maxGapIndex] + maxGap / 2
  }
}

export const normalWeapon = defineWeapon({
  type: WeaponType.NORMAL,
  name: 'Blaster',
  baseStats: {
    damage: 8,
    fireRate: 2,
    projectileCount: 1,
    projectileSpeed: 300,
  },
  visuals: {
    color: '#fbbf24', // yellow
    size: 1,
  },

  calculateStats: (appliedItems: GameItem[]) => {
    const modifiers = aggregateModifiers(appliedItems)
    const stats = applyModifiers(normalWeapon.baseStats, modifiers)
    const visuals = {
      ...normalWeapon.visuals,
      size: normalWeapon.visuals.size * (1 + (modifiers.projectileSizeMultiplier || 0)),
    }
    return { ...stats, visuals }
  },

  shoot: (
    context: ShootContext,
    lastFireTime: number,
    projectileAngles: number[]
  ): ShootResult | null => {
    const { player, currentTime, weapon, config, projectileIdCounter } = context
    const fireInterval = 1000 / weapon.fireRate

    if (currentTime - lastFireTime < fireInterval) return null

    const projectiles: Projectile[] = []
    const count = Math.floor(weapon.projectileCount)

    // Ensure we have the right number of projectile angles
    const angles = [...projectileAngles]
    while (angles.length < count) {
      const newAngle = findBiggestGap(angles)
      angles.push(newAngle)
    }

    // Shoot projectiles at each angle (relative to player rotation)
    angles.forEach((relativeAngle) => {
      const actualAngle = relativeAngle + player.rotation
      const velocity: Vector2 = {
        x: Math.cos(actualAngle) * weapon.projectileSpeed,
        y: Math.sin(actualAngle) * weapon.projectileSpeed,
      }

      projectiles.push({
        id: `projectile_${projectileIdCounter.current++}`,
        position: { x: player.position.x, y: player.position.y },
        velocity,
        angle: actualAngle,
        damage: weapon.damage,
        radius: config.projectileRadius * weapon.visualSize,
        weaponType: WeaponType.NORMAL,
        isPulse: false,
      })
    })

    return {
      projectiles,
      lastFireTime: currentTime,
    }
  },

  createProjectileBehavior: (): ProjectileBehavior => {
    return (projectile, { deltaTime, runtime, currentTime }) => {
      // Update position based on velocity
      projectile.position.x += projectile.velocity.x * deltaTime
      projectile.position.y += projectile.velocity.y * deltaTime

      const { config } = runtime

      // Remove if out of bounds
      if (
        projectile.position.x > config.canvasWidth + 20 ||
        projectile.position.x < -20 ||
        projectile.position.y > config.canvasHeight + 20 ||
        projectile.position.y < -20
      ) {
        return false
      }

      // Check collision with enemies
      const enemies = runtime.state.enemies

      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]
        const dx = projectile.position.x - enemy.position.x
        const dy = projectile.position.y - enemy.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const isColliding = distance < projectile.radius + config.enemySize / 2

        if (!isColliding) continue

        const removeProjectile = runtime.handleProjectileHit(
          enemy,
          projectile,
          currentTime,
          true // normal projectiles are removed on hit by default
        )

        if (removeProjectile) {
          return false
        }
      }

      return true
    }
  },

  getEventHandlers: (appliedItems: GameItem[]) => {
    return aggregateEventHandlers(appliedItems)
  },
} satisfies GameWeapon)
