import type { GameWeapon, ShootContext, ShootResult } from './base'
import { applyModifiers, aggregateModifiers, aggregateEventHandlers } from './base'
import type { GameItem } from '../items/base'
import type { Projectile } from '../types'
import { WeaponType } from '../types'
import { defineWeapon } from './registry'

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

  getEventHandlers: (appliedItems: GameItem[]) => {
    return aggregateEventHandlers(appliedItems)
  },
} satisfies GameWeapon)
