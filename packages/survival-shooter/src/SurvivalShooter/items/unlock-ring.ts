import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const unlockRing = defineItem({
  id: 'unlock_ring',
  name: 'Ring Weapon',
  description: 'Unlock Expanding Ring',
  unlocksWeapon: WeaponType.RING,
  stackable: false, // Can only unlock once
} satisfies GameItem)
