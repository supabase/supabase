import type {
  GameWeapon,
  ShootContext,
  ShootResult,
  ProjectileBehavior,
  ProjectileRenderFunction,
} from './base'
import { applyModifiers, aggregateModifiers, aggregateEventHandlers } from './base'
import type { Vector2, Projectile } from '../types'
import type { GameItem } from '../items/base'
import { WeaponType } from '../types'
import { defineWeapon } from './registry'

// Shotgun fires arc-shaped projectiles in front of the player
// Each "projectile" is an arc segment that moves outward
// Additional projectiles add more arc segments stacked behind each other

const SHOTGUN_ARC_ANGLE = Math.PI / 3 // 60 degrees arc
const SHOTGUN_ARC_RADIUS = 40 // radius of the arc segment
const SHOTGUN_PROJECTILE_SPEED = 250 // how fast the arc moves outward

export const shotgunWeapon = defineWeapon({
  type: WeaponType.SHOTGUN,
  name: 'Shotgun',
  baseStats: {
    damage: 12,
    fireRate: 1.2, // slower than normal weapon (1.2 attacks/sec vs 2)
    projectileCount: 1,
    projectileSpeed: SHOTGUN_PROJECTILE_SPEED,
  },
  visuals: {
    color: '#f97316', // orange
    size: 1,
  },

  calculateStats: (appliedItems: GameItem[]) => {
    const modifiers = aggregateModifiers(appliedItems)
    const stats = applyModifiers(shotgunWeapon.baseStats, modifiers)
    const visuals = {
      ...shotgunWeapon.visuals,
      size: shotgunWeapon.visuals.size * (1 + (modifiers.projectileSizeMultiplier || 0)),
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

    // Each "projectile" is an arc segment that moves in the direction the player is facing
    // Additional projectiles spawn staggered slightly behind
    for (let i = 0; i < count; i++) {
      const offset = i * 20 // stagger each arc slightly behind the previous one
      const spawnAngle = player.rotation

      // Calculate spawn position (slightly offset for each additional arc)
      const spawnX = player.position.x - Math.cos(spawnAngle) * offset
      const spawnY = player.position.y - Math.sin(spawnAngle) * offset

      // Velocity in the direction the player is facing
      const velocity: Vector2 = {
        x: Math.cos(spawnAngle) * weapon.projectileSpeed,
        y: Math.sin(spawnAngle) * weapon.projectileSpeed,
      }

      projectiles.push({
        id: `projectile_${projectileIdCounter.current++}`,
        position: { x: spawnX, y: spawnY },
        velocity,
        angle: spawnAngle, // arc is centered on player rotation
        damage: weapon.damage,
        radius: SHOTGUN_ARC_RADIUS * weapon.visualSize,
        weaponType: WeaponType.SHOTGUN,
        isPulse: false,
        createdAt: currentTime,
        initialRadius: SHOTGUN_ARC_RADIUS * weapon.visualSize,
      })
    }

    return {
      projectiles,
      lastFireTime: currentTime,
    }
  },

  createProjectileBehavior: (): ProjectileBehavior => {
    return (projectile, { deltaTime, runtime, currentTime }) => {
      // Move the arc projectile forward
      projectile.position.x += projectile.velocity.x * deltaTime
      projectile.position.y += projectile.velocity.y * deltaTime

      const { config } = runtime

      // Remove if out of bounds
      if (
        projectile.position.x > config.canvasWidth + 50 ||
        projectile.position.x < -50 ||
        projectile.position.y > config.canvasHeight + 50 ||
        projectile.position.y < -50
      ) {
        return false
      }

      const enemies = runtime.state.enemies
      const arcThickness = 20 // thickness of the arc segment

      // Arc collision: check if enemy is within the arc segment
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]

        // Calculate relative position of enemy to the arc center
        const dx = enemy.position.x - projectile.position.x
        const dy = enemy.position.y - projectile.position.y
        const distanceFromArcCenter = Math.sqrt(dx * dx + dy * dy)

        // Check if enemy is at the right distance from the arc center (within arc radius)
        const isAtCorrectDistance =
          Math.abs(distanceFromArcCenter - projectile.radius) <
          arcThickness + runtime.config.enemySize / 2

        if (!isAtCorrectDistance) continue

        // Check if enemy is within the arc angle relative to the arc's direction
        const angleToEnemy = Math.atan2(dy, dx)
        const arcCenterAngle = projectile.angle
        let angleDiff = angleToEnemy - arcCenterAngle

        // Normalize angle difference to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

        const isWithinArc = Math.abs(angleDiff) <= SHOTGUN_ARC_ANGLE / 2

        if (!isWithinArc) continue

        // Hit detected
        runtime.handleProjectileHit(
          enemy,
          projectile,
          currentTime,
          false // shotgun arcs persist through hits
        )
      }

      return true
    }
  },

  createProjectileRenderer: (): ProjectileRenderFunction => {
    return (projectile, { ctx }) => {
      ctx.strokeStyle = '#f97316' // orange
      ctx.lineWidth = 4
      ctx.globalAlpha = 0.7
      ctx.beginPath()

      // Arc angle is 60 degrees (PI/3), centered on projectile.angle
      const arcAngle = SHOTGUN_ARC_ANGLE
      const startAngle = projectile.angle - arcAngle / 2
      const endAngle = projectile.angle + arcAngle / 2

      ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, startAngle, endAngle)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  },

  getEventHandlers: (appliedItems: GameItem[]) => {
    return aggregateEventHandlers(appliedItems)
  },
} satisfies GameWeapon)
