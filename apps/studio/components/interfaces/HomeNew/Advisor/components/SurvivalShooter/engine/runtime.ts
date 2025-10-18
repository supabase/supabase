import {
  type Enemy,
  type GameConfig,
  type GameState,
  GameStatus,
  type Player,
  type PlayerStats,
  type Projectile,
  type SelectedCard,
  type Vector2,
  type Weapon,
  WeaponType,
} from '../types'
import type { GameItem } from '../items/base'
import { getItemById } from '../items'
import { aggregateEventHandlers } from '../weapons/base'
import { GameEventBus, type SpawnProjectileOptions } from '../events'
import { getAllWeapons, getWeaponByType } from '../weapons'
import { defaultPlayer } from '../player/default'

type RuntimeProjectile = Projectile & {
  behavior: ProjectileBehavior
}

type RuntimeEnemy = Enemy & {
  behavior: EnemyBehavior
}

type RuntimeGameState = GameState & {
  enemies: RuntimeEnemy[]
  projectiles: RuntimeProjectile[]
}

interface ProjectileUpdateContext {
  deltaTime: number
  currentTime: number
  runtime: GameRuntime
}

type ProjectileBehavior = (projectile: RuntimeProjectile, ctx: ProjectileUpdateContext) => boolean

interface EnemyUpdateContext {
  deltaTime: number
  currentTime: number
  runtime: GameRuntime
}

type EnemyBehavior = (enemy: RuntimeEnemy, ctx: EnemyUpdateContext) => boolean

interface ItemBuckets {
  global: GameItem[]
  perWeapon: Map<WeaponType, GameItem[]>
  unlockedWeapons: Set<WeaponType>
}


export class GameRuntime {
  readonly events = new GameEventBus()
  state: RuntimeGameState

  private enemyIdCounter = 0
  private projectileIdCounter = 0
  private readonly baseStats: PlayerStats
  config: GameConfig // made public for behavior functions
  private itemSubscriptions: Array<() => void> = []
  private selectedCards: SelectedCard[] = []
  private inputVector: Vector2 = { x: 0, y: 0 }

  constructor(config: GameConfig, baseStats: PlayerStats) {
    this.config = config
    this.baseStats = baseStats
    this.state = this.createInitialState([], 0)
  }

  initialize(selectedCards: SelectedCard[], maxSelectableItems: number): RuntimeGameState {
    this.enemyIdCounter = 0
    this.projectileIdCounter = 0
    this.selectedCards = selectedCards
    this.events.clear()
    this.teardownItemHandlers()
    this.state = this.createInitialState(selectedCards, maxSelectableItems)
    this.applySelectedCards(selectedCards, maxSelectableItems)
    return this.state
  }

  updateConfig(config: GameConfig) {
    this.config = config
  }

  updateSelectedCards(selectedCards: SelectedCard[], maxSelectableItems: number) {
    this.selectedCards = selectedCards
    this.state.selectedCards = selectedCards
    this.applySelectedCards(selectedCards, maxSelectableItems)
  }

  setMousePosition(position: Vector2 | null) {
    this.state.mousePosition = position
  }

  setInputVector(vector: Vector2) {
    this.inputVector = vector
  }

  updatePlayerRotation() {
    const { mousePosition, player } = this.state
    if (!mousePosition) return

    const dx = mousePosition.x - player.position.x
    const dy = mousePosition.y - player.position.y
    player.rotation = Math.atan2(dy, dx)
  }

  tick(deltaTime: number, currentTime: number) {
    if (this.state.status !== GameStatus.PLAYING) {
      return
    }

    this.state.score += deltaTime
    this.updatePlayerRotation()
    this.tickPlayer(deltaTime, currentTime)
    this.handleWeapons(currentTime)
    this.updateProjectiles(deltaTime, currentTime)
    this.updateEnemies(deltaTime, currentTime)
    this.spawnEnemiesIfNeeded(currentTime)
    this.updateWaveFromScore(this.state.score)

    if (this.state.player.stats.currentHp <= 0) {
      this.state.player.stats.currentHp = 0
      this.state.status = GameStatus.GAME_OVER
    }
  }

  spawnProjectile(projectile: SpawnProjectileOptions, currentTime: number) {
    const id = projectile.id ?? this.nextProjectileId()
    const createdAt = projectile.createdAt ?? currentTime

    // Get behavior from weapon definition
    const weaponDefinition = getWeaponByType(projectile.weaponType)
    const behavior = weaponDefinition.createProjectileBehavior()

    const runtimeProjectile: RuntimeProjectile = {
      ...projectile,
      id,
      createdAt,
      behavior,
    }

    this.state.projectiles.push(runtimeProjectile)
  }

  damagePlayer(amount: number, enemy?: RuntimeEnemy, currentTime?: number) {
    const result = defaultPlayer.damage({
      player: this.state.player,
      amount,
      enemy,
      currentTime: currentTime ?? performance.now(),
      events: this.events,
    })

    // Handle reflect damage if enemy was provided
    if (enemy && result.reflectDamage > 0) {
      enemy.hp -= result.reflectDamage
    }
  }

  healPlayer(amount: number) {
    defaultPlayer.heal(this.state.player, amount)
  }

  handleProjectileHit(
    enemy: RuntimeEnemy,
    projectile: RuntimeProjectile,
    currentTime: number,
    defaultShouldRemove: boolean
  ): boolean {
    const player = this.state.player
    const baseDamage = projectile.damage
    const willBeLethal = enemy.hp - baseDamage <= 0

    const damageResult = this.events.emitDamage(projectile.weaponType, {
      weaponType: projectile.weaponType,
      damageDealt: baseDamage,
      enemy,
      projectile,
      player,
      wasLethal: willBeLethal,
    })

    if (damageResult.healAmount) {
      this.healPlayer(damageResult.healAmount)
    }

    const totalDamage = baseDamage + damageResult.additionalDamage
    enemy.hp -= totalDamage

    const enemyDead = enemy.hp <= 0
    if (enemyDead) {
      this.handleEnemyDeath(enemy, projectile, currentTime)
    }

    if (damageResult.shouldRemoveProjectile !== null) {
      return damageResult.shouldRemoveProjectile ?? defaultShouldRemove
    }

    return defaultShouldRemove
  }

  getPlayerRadius(): number {
    return defaultPlayer.getRadius(this.state.player)
  }

  private createInitialState(
    selectedCards: SelectedCard[],
    maxSelectableItems: number
  ): RuntimeGameState {
    const stats = this.computeInitialStats(selectedCards)
    const player = this.createPlayer(stats)

    return {
      status: GameStatus.PLAYING,
      player,
      enemies: [],
      projectiles: [],
      wave: {
        waveNumber: 1,
        enemiesRemaining: 0,
        spawnRate: 0.5,
        lastSpawnTime: 0,
      },
      score: 0,
      selectedCards,
      mousePosition: null,
      maxSelectableItems,
    }
  }

  private computeInitialStats(selectedCards: SelectedCard[]): PlayerStats {
    // Get all items for calculating stats
    const allItems: GameItem[] = []
    selectedCards.forEach((card) => {
      const item = getItemById(card.item.id)
      if (item) allItems.push(item)
    })

    // Use player system to calculate base stats
    const calculatedStats = defaultPlayer.calculateStats(allItems)

    // Return PlayerStats (keeps existing deprecated fields for compatibility)
    const stats: PlayerStats = {
      maxHp: calculatedStats.maxHp,
      currentHp: calculatedStats.currentHp,
      moveSpeed: calculatedStats.moveSpeed,
      attackSpeed: this.baseStats.attackSpeed,
      attackDamage: this.baseStats.attackDamage,
      projectileCount: this.baseStats.projectileCount,
      projectileSize: this.baseStats.projectileSize,
      pulseEnabled: this.baseStats.pulseEnabled,
    }

    return stats
  }

  private createPlayer(stats: PlayerStats): Player {
    return {
      position: { x: this.config.canvasWidth / 2, y: this.config.canvasHeight / 2 },
      rotation: 0,
      stats,
      modifiers: {
        damageMultiplier: 1,
        fireRateMultiplier: 1,
        projectileCountBonus: 0,
        projectileSizeMultiplier: 1,
      },
      weapons: [],
      lastAttackTime: 0,
      lastPulseTime: 0,
      projectileAngles: [],
    }
  }

  private applySelectedCards(selectedCards: SelectedCard[], maxSelectableItems: number) {
    const buckets = this.collectItems(selectedCards)
    this.registerItemHandlers(buckets)
    this.updatePlayerStats(selectedCards)
    this.updateWeapons(buckets)
    this.state.maxSelectableItems = maxSelectableItems
  }

  private collectItems(selectedCards: SelectedCard[]): ItemBuckets {
    const global: GameItem[] = []
    const perWeapon: Map<WeaponType, GameItem[]> = new Map()
    const unlocked = new Set<WeaponType>([WeaponType.NORMAL])

    getAllWeapons().forEach((weapon) => {
      perWeapon.set(weapon.type, [])
    })

    selectedCards.forEach((card) => {
      const item = getItemById(card.item.id)
      if (!item) return

      if (item.unlocksWeapon) {
        unlocked.add(item.unlocksWeapon)
      }

      if (item.requiresWeaponSelection) {
        if (!card.assignedWeaponType) return
        const bucket = perWeapon.get(card.assignedWeaponType)
        if (bucket) {
          bucket.push(item)
        }
        return
      }

      global.push(item)
    })

    return { global, perWeapon, unlockedWeapons: unlocked }
  }

  private registerItemHandlers({ global, perWeapon }: ItemBuckets) {
    this.teardownItemHandlers()

    if (global.length > 0) {
      const handlers = aggregateEventHandlers(global)
      if (handlers.onDamage) {
        this.itemSubscriptions.push(this.events.onDamage(handlers.onDamage))
      }
      if (handlers.onEnemyDeath) {
        this.itemSubscriptions.push(this.events.onEnemyDeath(handlers.onEnemyDeath))
      }
      if (handlers.onShoot) {
        this.itemSubscriptions.push(this.events.onShoot(handlers.onShoot))
      }
      if (handlers.onPlayerUpdate) {
        this.itemSubscriptions.push(this.events.onPlayerUpdate(handlers.onPlayerUpdate))
      }
      if (handlers.onPlayerMove) {
        this.itemSubscriptions.push(this.events.onPlayerMove(handlers.onPlayerMove))
      }
      if (handlers.onPlayerDamaged) {
        this.itemSubscriptions.push(this.events.onPlayerDamaged(handlers.onPlayerDamaged))
      }
    }

    perWeapon.forEach((items, weaponType) => {
      if (items.length === 0) return
      const weaponDefinition = getWeaponByType(weaponType)
      const handlers = weaponDefinition.getEventHandlers(items)

      if (handlers.onDamage) {
        this.itemSubscriptions.push(this.events.onDamage(handlers.onDamage, weaponType))
      }
      if (handlers.onEnemyDeath) {
        this.itemSubscriptions.push(this.events.onEnemyDeath(handlers.onEnemyDeath, weaponType))
      }
      if (handlers.onShoot) {
        this.itemSubscriptions.push(this.events.onShoot(handlers.onShoot, weaponType))
      }
    })
  }

  private updatePlayerStats(selectedCards: SelectedCard[]) {
    const previousMaxHp = this.state.player.stats.maxHp
    const previousCurrentHp = this.state.player.stats.currentHp
    const newStats = this.computeInitialStats(selectedCards)

    const hpDiff = newStats.maxHp - previousMaxHp

    this.state.player.stats = {
      ...this.state.player.stats,
      ...newStats,
      currentHp:
        hpDiff > 0
          ? Math.min(newStats.maxHp, previousCurrentHp + hpDiff)
          : Math.min(previousCurrentHp, newStats.maxHp),
    }
  }

  private updateWeapons({ perWeapon, unlockedWeapons }: ItemBuckets) {
    const player = this.state.player
    const existingByType = new Map<WeaponType, Weapon>(
      player.weapons.map((weapon) => [weapon.type, weapon])
    )

    const updatedWeapons: Weapon[] = []

    unlockedWeapons.forEach((weaponType) => {
      const definition = getWeaponByType(weaponType)
      const items = perWeapon.get(weaponType) || []
      const stats = definition.calculateStats(items)
      const existing = existingByType.get(weaponType)

      updatedWeapons.push({
        id: existing?.id ?? `${weaponType}_weapon`,
        type: weaponType,
        damage: stats.damage,
        fireRate: stats.fireRate,
        projectileCount: stats.projectileCount,
        projectileSpeed: stats.projectileSpeed,
        visuals: stats.visuals,
        lastFireTime: existing?.lastFireTime ?? 0,
        projectileAngles: existing?.projectileAngles ?? [],
        appliedItems: existing?.appliedItems,
      })
    })

    player.weapons = updatedWeapons
  }

  private tickPlayer(deltaTime: number, currentTime: number) {
    const player = this.state.player
    const oldPosition = { ...player.position }

    // Get all global items (items not assigned to specific weapons)
    const globalItems: GameItem[] = []
    this.selectedCards.forEach((card) => {
      if (!card.assignedWeaponType) {
        const item = getItemById(card.item.id)
        if (item) globalItems.push(item)
      }
    })

    // Update player position using player system
    const result = defaultPlayer.update({
      player,
      deltaTime,
      currentTime,
      inputVector: this.inputVector,
      config: {
        canvasWidth: this.config.canvasWidth,
        canvasHeight: this.config.canvasHeight,
        playerRadius: this.getPlayerRadius(),
      },
    })

    player.position = result.position

    // Emit player move event if position changed
    if (oldPosition.x !== player.position.x || oldPosition.y !== player.position.y) {
      this.events.emitPlayerMove({
        player,
        oldPosition,
        newPosition: player.position,
        deltaTime,
      })
    }

    // Emit player update event and handle regen/effects
    const updateResult = this.events.emitPlayerUpdate({
      player,
      deltaTime,
      currentTime,
    })

    if (updateResult.healAmount > 0) {
      this.healPlayer(updateResult.healAmount * deltaTime) // scale by deltaTime for per-second effects
    }
  }

  private handleWeapons(currentTime: number) {
    const projectileCounterRef = { current: this.projectileIdCounter }
    const config = this.config
    const player = this.state.player

    player.weapons.forEach((weapon) => {
      const definition = getWeaponByType(weapon.type)
      const result = definition.shoot(
        {
          player,
          currentTime,
          weapon: {
            damage: weapon.damage,
            fireRate: weapon.fireRate,
            projectileCount: weapon.projectileCount,
            projectileSpeed: weapon.projectileSpeed,
            visualSize: weapon.visuals.size,
          },
          config: {
            playerRadius: config.playerRadius,
            projectileRadius: config.projectileRadius,
          },
          projectileIdCounter: projectileCounterRef,
        },
        weapon.lastFireTime,
        weapon.projectileAngles
      )

      if (!result) return

      weapon.lastFireTime = result.lastFireTime

      result.projectiles.forEach((projectile) => {
        this.spawnProjectile(projectile, currentTime)
      })
    })

    this.projectileIdCounter = projectileCounterRef.current
  }

  private updateProjectiles(deltaTime: number, currentTime: number) {
    const projectiles = this.state.projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i]
      const keep = projectile.behavior(projectile, {
        deltaTime,
        currentTime,
        runtime: this,
      })
      if (!keep) {
        projectiles.splice(i, 1)
      }
    }
  }

  private updateEnemies(deltaTime: number, currentTime: number) {
    const enemies = this.state.enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      const keep = enemy.behavior(enemy, {
        deltaTime,
        currentTime,
        runtime: this,
      })
      if (!keep) {
        enemies.splice(i, 1)
      }
    }
  }

  private spawnEnemiesIfNeeded(currentTime: number) {
    const { wave } = this.state
    const spawnInterval = 1000 / wave.spawnRate
    if (currentTime - wave.lastSpawnTime <= spawnInterval) return

    wave.lastSpawnTime = currentTime
    this.state.enemies.push(this.createEnemy(wave.waveNumber))
  }

  private createEnemy(waveNumber: number): RuntimeEnemy {
    const { canvasWidth, canvasHeight } = this.config
    const id = `enemy_${this.enemyIdCounter++}`
    const angle = Math.random() * Math.PI * 2
    const baseHp = 20
    const baseSpeed = 40
    const speed = baseSpeed + waveNumber * 2
    const hp = baseHp + waveNumber * 5

    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    const spawnDistance = Math.max(canvasWidth, canvasHeight) * 0.7

    const spawnX = centerX + Math.cos(angle) * spawnDistance
    const spawnY = centerY + Math.sin(angle) * spawnDistance

    const dx = centerX - spawnX
    const dy = centerY - spawnY
    const distance = Math.sqrt(dx * dx + dy * dy)

    const velocity: Vector2 = distance === 0
      ? { x: 0, y: 0 }
      : {
          x: (dx / distance) * speed,
          y: (dy / distance) * speed,
        }

    const enemy: RuntimeEnemy = {
      id,
      position: { x: spawnX, y: spawnY },
      velocity,
      hp,
      maxHp: hp,
      speed,
      damage: 10 + waveNumber * 2,
      behavior: createEnemyBehavior(),
    }

    return enemy
  }

  private handleEnemyDeath(enemy: RuntimeEnemy, projectile: RuntimeProjectile, currentTime: number) {
    const deathResult = this.events.emitEnemyDeath(projectile.weaponType, {
      enemy,
      player: this.state.player,
      projectile,
      weaponType: projectile.weaponType,
      enemies: this.state.enemies,
      currentTime,
      spawnProjectile: (options) => this.spawnProjectile(options, currentTime),
    })

    if (deathResult.healAmount) {
      this.healPlayer(deathResult.healAmount)
    }

    const index = this.state.enemies.findIndex((candidate) => candidate.id === enemy.id)
    if (index >= 0) {
      this.state.enemies.splice(index, 1)
    }
  }

  private updateWaveFromScore(score: number) {
    const { wave } = this.state
    const newWaveNumber = Math.floor(score / 10) + 1
    if (newWaveNumber <= wave.waveNumber) return

    wave.waveNumber = newWaveNumber
    wave.spawnRate = 0.5 + (newWaveNumber - 1) * 0.3
  }

  private teardownItemHandlers() {
    if (this.itemSubscriptions.length === 0) return
    this.itemSubscriptions.forEach((unsubscribe) => unsubscribe())
    this.itemSubscriptions = []
  }

  private nextProjectileId(): string {
    return `projectile_${this.projectileIdCounter++}`
  }
}

const createProjectileBehavior = (): ProjectileBehavior => {
  return (projectile, { deltaTime, runtime, currentTime }) => {
    projectile.position.x += projectile.velocity.x * deltaTime
    projectile.position.y += projectile.velocity.y * deltaTime

    const { config } = runtime

    if (
      projectile.position.x > config.canvasWidth + 20 ||
      projectile.position.x < -20 ||
      projectile.position.y > config.canvasHeight + 20 ||
      projectile.position.y < -20
    ) {
      return false
    }

    const enemies = runtime.state.enemies

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      const dx = projectile.position.x - enemy.position.x
      const dy = projectile.position.y - enemy.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const isColliding = distance < projectile.radius + runtime.config.enemySize / 2

      if (!isColliding) continue

      const removeProjectile = runtime.handleProjectileHit(
        enemy,
        projectile,
        currentTime,
        true
      )

      if (removeProjectile) {
        return false
      }
    }

    return true
  }
}

const createPulseBehavior = (): ProjectileBehavior => {
  return (projectile, { currentTime, runtime }) => {
    const startTime = projectile.createdAt ?? currentTime
    const ageSeconds = (currentTime - startTime) / 1000
    const initialRadius = projectile.initialRadius ?? runtime.config.playerRadius

    projectile.radius = initialRadius + ageSeconds * RING_EXPANSION_SPEED

    const maxDimension = Math.max(runtime.config.canvasWidth, runtime.config.canvasHeight)
    const maxAge = projectile.maxAge ?? DEFAULT_RING_MAX_AGE

    if (ageSeconds > maxAge || projectile.radius > maxDimension) {
      return false
    }

    const playerPosition = runtime.state.player.position
    const enemies = runtime.state.enemies
    const ringThickness = 20

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i]
      const dx = enemy.position.x - playerPosition.x
      const dy = enemy.position.y - playerPosition.y
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

      const isColliding =
        Math.abs(distanceFromCenter - projectile.radius) <
        ringThickness + runtime.config.enemySize / 2

      if (!isColliding) continue

      runtime.handleProjectileHit(enemy, projectile, currentTime, false)
    }

    return true
  }
}

const createEnemyBehavior = (): EnemyBehavior => {
  return (enemy, { deltaTime, runtime, currentTime }) => {
    const player = runtime.state.player
    const dx = player.position.x - enemy.position.x
    const dy = player.position.y - enemy.position.y
    const distance = Math.sqrt(dx * dx + dy * dy) || 1

    enemy.velocity.x = (dx / distance) * enemy.speed
    enemy.velocity.y = (dy / distance) * enemy.speed

    enemy.position.x += enemy.velocity.x * deltaTime
    enemy.position.y += enemy.velocity.y * deltaTime

    const playerRadius = runtime.getPlayerRadius()
    if (distance < playerRadius + runtime.config.enemySize / 2) {
      runtime.damagePlayer(enemy.damage, enemy, currentTime)
      return false
    }

    return enemy.hp > 0
  }
}
