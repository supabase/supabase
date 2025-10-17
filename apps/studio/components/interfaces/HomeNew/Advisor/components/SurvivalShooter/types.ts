export interface Vector2 {
  x: number
  y: number
}

export enum WeaponType {
  NORMAL = 'normal',
  RING = 'ring',
}

export interface WeaponVisuals {
  color: string
  size: number // size multiplier
  glowIntensity?: number
}

export interface Weapon {
  id: string
  type: WeaponType
  damage: number
  fireRate: number // attacks per second
  projectileCount: number
  projectileSpeed: number
  visuals: WeaponVisuals
  lastFireTime: number
  projectileAngles: number[] // for multi-projectile weapons
  appliedItems?: SelectedCard[]
}

export interface PlayerStats {
  maxHp: number
  currentHp: number
  moveSpeed: number
  attackSpeed: number // attacks per second (deprecated - use modifiers)
  attackDamage: number // deprecated - use modifiers
  projectileCount: number // deprecated - use modifiers
  projectileSize: number // multiplier for projectile radius (deprecated - use modifiers)
  pulseEnabled: boolean // deprecated - use UNLOCK_RING item
}

export interface WeaponModifiers {
  damageMultiplier: number // 1.0 = base, 1.25 = +25%
  fireRateMultiplier: number // 1.0 = base, 1.25 = +25% faster
  projectileCountBonus: number // additive, e.g., +2 projectiles
  projectileSizeMultiplier: number // 1.0 = base, 1.5 = +50% larger
}

export interface Player {
  position: Vector2
  rotation: number // angle in radians
  stats: PlayerStats
  modifiers: WeaponModifiers
  weapons: Weapon[]
  lastAttackTime: number // deprecated, kept for compatibility
  lastPulseTime: number // deprecated, kept for compatibility
  projectileAngles: number[] // deprecated, kept for compatibility
}

export interface Enemy {
  id: string
  position: Vector2
  velocity: Vector2
  hp: number
  maxHp: number
  speed: number
  damage: number
}

export interface Projectile {
  id: string
  position: Vector2
  velocity: Vector2
  angle: number
  damage: number
  radius: number
  weaponType: WeaponType
  isPulse: boolean // deprecated, use weaponType === PULSE
  createdAt?: number // for pulse expansion
}

export enum ItemType {
  HP_INCREASE = 'hp_increase',
  ATTACK_SPEED = 'attack_speed',
  ATTACK_DAMAGE = 'attack_damage',
  PROJECTILE_COUNT = 'projectile_count',
  PROJECTILE_SIZE = 'projectile_size',
  UNLOCK_RING = 'unlock_ring',
  LIFE_STEAL = 'life_steal',
}

// For backwards compatibility
export const PerkType = ItemType

export interface Perk {
  type: PerkType
  name: string
  description: string
  value: number // percentage or flat value depending on type
}

export interface Card {
  id: string
  name: string
  description: string
  cardType: 'weapon' | 'stat'
  weapon?: Weapon
  perks: Perk[]
  requiresWeaponSelection?: boolean
  applicableWeaponTypes?: WeaponType[]
}

export interface SelectedCard {
  card: Card
  assignedWeaponType?: WeaponType
}

export enum GameStatus {
  CARD_SELECTION = 'card_selection',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
}

export interface Wave {
  waveNumber: number
  enemiesRemaining: number
  spawnRate: number // enemies per second
  lastSpawnTime: number
}

export interface GameState {
  status: GameStatus
  player: Player
  enemies: Enemy[]
  projectiles: Projectile[]
  wave: Wave
  score: number // survival time in seconds
  selectedCards: SelectedCard[]
  mousePosition: Vector2 | null
  maxSelectableItems: number
}

export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  playerRadius: number
  enemySize: number
  projectileRadius: number
  basePlayerStats: PlayerStats
}
