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

export interface SelectedCard {
  // Store minimal item info (full GameItem retrieved from registry when needed)
  item: {
    id: string
    name: string
    description: string
    requiresWeaponSelection?: boolean
    applicableWeaponTypes?: WeaponType[]
    unlocksWeapon?: WeaponType
    stackable?: boolean
  }
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
