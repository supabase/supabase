import { WeaponType } from '../types'
import type { GameItem } from './base'
import { defineItem } from './registry'

export const unlockShotgun = defineItem({
  id: 'unlock_shotgun',
  name: 'Shotgun',
  description: 'Unlock Arc Shotgun',
  unlocksWeapon: WeaponType.SHOTGUN,
  stackable: false, // Can only unlock once
} satisfies GameItem)
