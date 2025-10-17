import type { GameItem } from './base'
import { WeaponType } from '../types'

export const unlockRing: GameItem = {
  id: 'unlock_ring',
  name: 'Ring Weapon',
  description: 'Unlock Expanding Ring',
  unlocksWeapon: WeaponType.RING,
  stackable: false, // Can only unlock once
}
