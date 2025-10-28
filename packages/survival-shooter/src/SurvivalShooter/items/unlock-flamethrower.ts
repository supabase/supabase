import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const unlockFlamethrower = defineItem({
  id: 'unlock_flamethrower',
  name: 'Flamethrower',
  description: 'Unlock Rotating Flamethrower',
  unlocksWeapon: WeaponType.FLAMETHROWER,
  stackable: false, // Can only unlock once
} satisfies GameItem)
