import type {
  GameWeapon,
  ShootContext,
  ShootResult,
  ProjectileBehavior,
  ProjectileRenderFunction,
} from './base'
import { applyModifiers, aggregateModifiers, aggregateEventHandlers } from './base'
import type { GameItem } from '../items/base'
import type { Projectile } from '../types'
import { WeaponType } from '../types'
import { defineWeapon } from './registry'

const DEFAULT_LINE_LENGTH = 80
const BASE_ROTATION_SPEED = Math.PI // 180 degrees per second

export const flamethrowerWeapon = defineWeapon({
  type: WeaponType.FLAMETHROWER,
  name: 'Flamethrower',
  baseStats: {
    damage: 2,
    fireRate: 10, // how fast it rotates
    projectileCount: 1, // length of the line
    projectileSpeed: 0, // doesn't move from player
  },
  visuals: {
    color: '#fb923c', // orange
    size: 1,
  },

  calculateStats: (appliedItems: GameItem[]) => {
    const modifiers = aggregateModifiers(appliedItems)
    const stats = applyModifiers(flamethrowerWeapon.baseStats, modifiers)
    const visuals = {
      ...flamethrowerWeapon.visuals,
      size: flamethrowerWeapon.visuals.size * (1 + (modifiers.projectileSizeMultiplier || 0)),
    }
    return { ...stats, visuals }
  },

  shoot: (
    context: ShootContext,
    lastFireTime: number,
    projectileAngles: number[]
  ): ShootResult | null => {
    const { player, currentTime, weapon, projectileIdCounter } = context

    // Only create the flamethrower projectile once
    // Check if we already fired (lastFireTime > 0 means we already created it)
    if (lastFireTime > 0) {
      return null // Flamethrower already exists, managed by its behavior
    }

    // Store current angle in projectileAngles array if not initialized
    if (projectileAngles.length === 0) {
      projectileAngles.push(0)
    }

    const projectiles: Projectile[] = []
    projectiles.push({
      id: `flamethrower_${projectileIdCounter.current++}`,
      position: { x: player.position.x, y: player.position.y },
      velocity: { x: 0, y: 0 },
      angle: projectileAngles[0], // current rotation angle
      damage: weapon.damage,
      radius: DEFAULT_LINE_LENGTH * weapon.projectileCount, // projectileCount increases length
      weaponType: WeaponType.FLAMETHROWER,
      isPulse: false,
      createdAt: currentTime,
    })

    return {
      projectiles,
      lastFireTime: currentTime,
    }
  },

  createProjectileBehavior: (): ProjectileBehavior => {
    return (projectile, { deltaTime, currentTime, runtime }) => {
      const playerPosition = runtime.state.player.position

      // Get the weapon to calculate rotation speed based on fireRate
      const weapon = runtime.state.player.weapons.find(
        (w) => w.type === WeaponType.FLAMETHROWER
      )
      if (!weapon) return false

      // Rotation speed scales with fireRate (attack speed)
      const rotationSpeed = BASE_ROTATION_SPEED * (weapon.fireRate / 10)

      // Update the rotation angle
      projectile.angle += rotationSpeed * deltaTime

      // Keep angle in 0-2π range
      if (projectile.angle > Math.PI * 2) {
        projectile.angle -= Math.PI * 2
      }

      // Keep position centered on player
      projectile.position.x = playerPosition.x
      projectile.position.y = playerPosition.y

      // Check collision with enemies along the line
      const lineLength = projectile.radius
      const lineThickness = 15

      const enemies = runtime.state.enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]

        // Calculate distance from enemy to the line segment
        const dx = enemy.position.x - playerPosition.x
        const dy = enemy.position.y - playerPosition.y

        // Vector to enemy
        const enemyDist = Math.sqrt(dx * dx + dy * dy)

        // Angle to enemy
        const angleToEnemy = Math.atan2(dy, dx)

        // Normalize angles to be in same range
        let angleDiff = angleToEnemy - projectile.angle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

        // Check if enemy is within the angular thickness of the line
        const maxAngleDiff = Math.atan2(lineThickness, enemyDist)

        if (Math.abs(angleDiff) < maxAngleDiff && enemyDist <= lineLength) {
          runtime.handleProjectileHit(
            enemy,
            projectile,
            currentTime,
            false // flamethrower persists through hits
          )
        }
      }

      // Flamethrower never expires, only one exists per weapon
      return true
    }
  },

  createProjectileRenderer: (): ProjectileRenderFunction => {
    return (projectile, { ctx }) => {
      ctx.strokeStyle = '#fb923c' // orange
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.8
      ctx.beginPath()

      const lineLength = projectile.radius
      const endX = projectile.position.x + Math.cos(projectile.angle) * lineLength
      const endY = projectile.position.y + Math.sin(projectile.angle) * lineLength

      ctx.moveTo(projectile.position.x, projectile.position.y)
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  },

  getEventHandlers: (appliedItems: GameItem[]) => {
    return aggregateEventHandlers(appliedItems)
  },
} satisfies GameWeapon)
