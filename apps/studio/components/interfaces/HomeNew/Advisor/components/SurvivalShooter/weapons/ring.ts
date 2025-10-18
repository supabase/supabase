import type { GameWeapon, ShootContext, ShootResult, ProjectileBehavior } from './base'
import { applyModifiers, aggregateModifiers, aggregateEventHandlers } from './base'
import type { GameItem } from '../items/base'
import type { Projectile } from '../types'
import { WeaponType } from '../types'
import { defineWeapon } from './registry'

const RING_EXPANSION_SPEED = 150
const DEFAULT_RING_MAX_AGE = 2

export const ringWeapon = defineWeapon({
  type: WeaponType.RING,
  name: 'Ring Weapon',
  baseStats: {
    damage: 1,
    fireRate: 0.5,
    projectileCount: 1,
    projectileSpeed: 0, // ring doesn't move
  },
  visuals: {
    color: '#a78bfa', // purple
    size: 1,
  },

  calculateStats: (appliedItems: GameItem[]) => {
    const modifiers = aggregateModifiers(appliedItems)
    const stats = applyModifiers(ringWeapon.baseStats, modifiers)
    const visuals = {
      ...ringWeapon.visuals,
      size: ringWeapon.visuals.size * (1 + (modifiers.projectileSizeMultiplier || 0)),
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

    // Ring weapon: expanding ring
    projectiles.push({
      id: `projectile_${projectileIdCounter.current++}`,
      position: { x: player.position.x, y: player.position.y },
      velocity: { x: 0, y: 0 },
      angle: 0,
      damage: weapon.damage,
      radius: config.playerRadius,
      weaponType: WeaponType.RING,
      isPulse: true,
      createdAt: currentTime,
      initialRadius: config.playerRadius,
    })

    return {
      projectiles,
      lastFireTime: currentTime,
    }
  },

  createProjectileBehavior: (): ProjectileBehavior => {
    return (projectile, { currentTime, runtime }) => {
      const startTime = projectile.createdAt ?? currentTime
      const ageSeconds = (currentTime - startTime) / 1000
      const initialRadius = projectile.initialRadius ?? runtime.config.playerRadius

      // Expand the ring over time
      projectile.radius = initialRadius + ageSeconds * RING_EXPANSION_SPEED

      const maxDimension = Math.max(runtime.config.canvasWidth, runtime.config.canvasHeight)
      const maxAge = projectile.maxAge ?? DEFAULT_RING_MAX_AGE

      // Remove if too old or too large
      if (ageSeconds > maxAge || projectile.radius > maxDimension) {
        return false
      }

      const playerPosition = runtime.state.player.position
      const enemies = runtime.state.enemies
      const ringThickness = 20

      // Ring collision: check if enemy is within the ring's edge
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]
        const dx = enemy.position.x - playerPosition.x
        const dy = enemy.position.y - playerPosition.y
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

        const isColliding =
          Math.abs(distanceFromCenter - projectile.radius) <
          ringThickness + runtime.config.enemySize / 2

        if (!isColliding) continue

        runtime.handleProjectileHit(
          enemy,
          projectile,
          currentTime,
          false // ring projectiles persist through hits
        )
      }

      return true
    }
  },

  getEventHandlers: (appliedItems: GameItem[]) => {
    return aggregateEventHandlers(appliedItems)
  },
} satisfies GameWeapon)
