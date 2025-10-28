import {
  type Enemy,
  type ExperienceDrop,
  type GameConfig,
  type GameState,
  GameStatus,
  type Player,
  type PlayerStats,
  type Projectile,
  type SelectedCard,
  type Vector2,
  type Weapon,
  type Particle,
  WeaponType,
} from '../types'
import type { GameItem } from '../items/base'
import { getItemById } from '../items'
import { aggregateEventHandlers } from '../weapons/base'
import {
  GameEventBus,
  type SpawnProjectileOptions,
  type ProjectileRenderFunction,
  type ProjectileBehaviorFunction,
} from '../events'
import { getAllWeapons, getWeaponByType } from '../weapons'
import { defaultPlayer } from '../player/default'
import { getEnemyByType, getRandomEnemyType } from '../enemies/registry'
import type { EnemyBehavior as GameEnemyBehavior, EnemyRenderFunction } from '../enemies/base'

interface ProjectileUpdateContext {
  deltaTime: number
  currentTime: number
  runtime: GameRuntime
}

type ProjectileBehavior = ProjectileBehaviorFunction

type RuntimeProjectile = Projectile & {
  behavior: ProjectileBehavior
  render: ProjectileRenderFunction
}

type RuntimeEnemy = Enemy & {
  behavior: GameEnemyBehavior
  render: EnemyRenderFunction
}

type RuntimeGameState = GameState & {
  enemies: RuntimeEnemy[]
  projectiles: RuntimeProjectile[]
}

interface EnemyUpdateContext {
  deltaTime: number
  currentTime: number
  runtime: GameRuntime
}

type EnemyBehavior = GameEnemyBehavior

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
  private experienceDropIdCounter = 0
  private particleIdCounter = 0
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
    this.experienceDropIdCounter = 0
    this.particleIdCounter = 0
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
    this.updateParticles(deltaTime, currentTime)
    this.updateExperienceDrops(deltaTime)
    this.collectExperienceDrops()
    this.spawnEnemiesIfNeeded(currentTime)
    this.updateWaveFromScore(this.state.score)

    if (this.state.player.stats.currentHp <= 0) {
      this.state.player.stats.currentHp = 0
      this.state.status = GameStatus.GAME_OVER
    }
  }

  private updateExperienceDrops(deltaTime: number) {
    const player = this.state.player
    const playerRadius = this.getPlayerRadius()
    const magnetRadius = 60 // Magnetic attraction range - need to be quite close

    for (const drop of this.state.experienceDrops) {
      const dx = player.position.x - drop.position.x
      const dy = player.position.y - drop.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < magnetRadius && distance > 0) {
        // Simple linear attraction that gets stronger when closer
        // Base speed increases as we get closer
        const baseSpeed = 120 // pixels per second at edge
        const closeBoost = (magnetRadius - distance) / magnetRadius // 0 at edge, 1 at center
        const speed = baseSpeed + (closeBoost * 330) // Up to 450 pixels/sec when very close

        // Direct velocity toward player
        const dirX = dx / distance
        const dirY = dy / distance

        drop.velocity.x = dirX * speed
        drop.velocity.y = dirY * speed
      } else {
        // Apply friction when not in magnetic range
        drop.velocity.x *= 0.8
        drop.velocity.y *= 0.8
      }

      // Update position
      drop.position.x += drop.velocity.x * deltaTime
      drop.position.y += drop.velocity.y * deltaTime
    }
  }

  private collectExperienceDrops() {
    const player = this.state.player
    const playerRadius = this.getPlayerRadius()
    const pickupRadius = playerRadius + 10 // pickup range

    for (let i = this.state.experienceDrops.length - 1; i >= 0; i--) {
      const drop = this.state.experienceDrops[i]
      const dx = drop.position.x - player.position.x
      const dy = drop.position.y - player.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < pickupRadius) {
        // Collect the experience
        const oldLevel = this.state.currentLevel
        this.state.experience += drop.value
        this.state.currentLevel = this.calculateLevel(this.state.experience)

        // Check if level up occurred
        if (this.state.currentLevel > oldLevel) {
          this.handleLevelUp()
        }

        // Remove the drop
        this.state.experienceDrops.splice(i, 1)
      }
    }
  }

  private calculateLevel(experience: number): number {
    // Exponential level progression: level = floor(sqrt(experience / 5)) + 1
    // Level 1: 0 exp, Level 2: 5 exp, Level 3: 20 exp, Level 4: 45 exp, Level 5: 80 exp, etc.
    return Math.floor(Math.sqrt(experience / 5)) + 1
  }

  getExperienceForLevel(level: number): number {
    // Inverse of calculateLevel: experience needed for a specific level
    return (level - 1) * (level - 1) * 5
  }

  getExperienceForNextLevel(): number {
    return this.getExperienceForLevel(this.state.currentLevel + 1)
  }

  private handleLevelUp() {
    // Pause the game
    this.state.status = GameStatus.PAUSED
    // The UI will detect this and show the item selection screen
  }

  spawnProjectile(projectile: SpawnProjectileOptions, currentTime: number) {
    const id = projectile.id ?? this.nextProjectileId()
    const createdAt = projectile.createdAt ?? currentTime

    // Use provided behavior/renderer if available, otherwise get from weapon definition
    let behavior: ProjectileBehavior
    let render: ProjectileRenderFunction

    if (projectile.behavior && projectile.render) {
      // Item provided custom behavior and renderer (e.g., explosions)
      behavior = projectile.behavior
      render = projectile.render
    } else if (projectile.isPulse) {
      // Legacy pulse projectiles (ring weapon)
      const weaponDefinition = getWeaponByType(projectile.weaponType)
      behavior = weaponDefinition.createProjectileBehavior()
      render = weaponDefinition.createProjectileRenderer()
    } else {
      // Standard weapon projectiles
      const weaponDefinition = getWeaponByType(projectile.weaponType)
      behavior = weaponDefinition.createProjectileBehavior()
      render = weaponDefinition.createProjectileRenderer()
    }

    const runtimeProjectile: RuntimeProjectile = {
      ...projectile,
      id,
      createdAt,
      behavior,
      render,
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
      experienceDrops: [],
      particles: [],
      wave: {
        waveNumber: 1,
        enemiesRemaining: 0,
        spawnRate: 0.5,
        lastSpawnTime: 0,
      },
      score: 0,
      enemiesKilled: 0,
      experience: 0,
      currentLevel: 1,
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

      // Items with weapon modifiers go to perWeapon bucket for stat calculations
      if (item.requiresWeaponSelection && card.assignedWeaponType) {
        const bucket = perWeapon.get(card.assignedWeaponType)
        if (bucket) {
          bucket.push(item)
        }
        // Note: weapon-specific items are NOT added to global bucket
        // Their handlers will be registered with weapon-specific scope
      } else {
        // Only non-weapon-specific items go to global bucket
        global.push(item)
      }
    })

    return { global, perWeapon, unlockedWeapons: unlocked }
  }

  private registerItemHandlers({ global, perWeapon }: ItemBuckets) {
    this.teardownItemHandlers()

    // Register global item event handlers
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

    // Register per-weapon item event handlers
    perWeapon.forEach((items, weaponType) => {
      if (items.length === 0) return

      const handlers = aggregateEventHandlers(items)
      if (handlers.onDamage) {
        this.itemSubscriptions.push(this.events.onDamage(handlers.onDamage, weaponType))
      }
      if (handlers.onEnemyDeath) {
        this.itemSubscriptions.push(this.events.onEnemyDeath(handlers.onEnemyDeath, weaponType))
      }
      if (handlers.onShoot) {
        this.itemSubscriptions.push(this.events.onShoot(handlers.onShoot, weaponType))
      }
      // Player events (onPlayerUpdate, onPlayerMove, onPlayerDamaged) are always global
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

    // Spawn boss every 5 waves
    const shouldSpawnBoss = wave.waveNumber % 5 === 0 && wave.waveNumber > 0
    const enemyType = shouldSpawnBoss && Math.random() < 0.1 // 10% chance per spawn during boss waves
      ? 'boss' as const
      : getRandomEnemyType()

    this.state.enemies.push(this.createEnemy(wave.waveNumber, enemyType))
  }

  private createEnemy(waveNumber: number, enemyType: ReturnType<typeof getRandomEnemyType> | 'boss'): RuntimeEnemy {
    const { canvasWidth, canvasHeight } = this.config
    const id = `enemy_${this.enemyIdCounter++}`
    const angle = Math.random() * Math.PI * 2

    // Get enemy definition and stats
    const enemyDef = getEnemyByType(enemyType)
    const stats = enemyDef.getStats(waveNumber)

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
          x: (dx / distance) * stats.speed,
          y: (dy / distance) * stats.speed,
        }

    const enemy: RuntimeEnemy = {
      id,
      type: enemyType,
      position: { x: spawnX, y: spawnY },
      velocity,
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      damage: stats.damage,
      size: stats.size,
      behavior: enemyDef.createBehavior(),
      render: enemyDef.createRenderer(),
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
      this.state.enemiesKilled++

      // Spawn death particles
      this.spawnDeathParticles(enemy, currentTime)

      // Spawn experience drop at enemy position - amount based on enemy type
      const enemyDef = getEnemyByType(enemy.type)
      this.spawnExperienceDrop(enemy.position, enemyDef.experienceValue)
    }
  }

  private spawnExperienceDrop(position: Vector2, value: number) {
    const drop: ExperienceDrop = {
      id: `exp_${this.experienceDropIdCounter++}`,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      value,
    }
    this.state.experienceDrops.push(drop)
  }

  private spawnParticle(
    position: Vector2,
    velocity: Vector2,
    color: string,
    size: number,
    lifetime: number,
    currentTime: number
  ) {
    const particle: Particle = {
      id: `particle_${this.particleIdCounter++}`,
      position: { ...position },
      velocity: { ...velocity },
      color,
      size,
      lifetime,
      createdAt: currentTime,
    }
    this.state.particles.push(particle)
  }

  private spawnDeathParticles(enemy: RuntimeEnemy, currentTime: number) {
    const particleCount = 8
    const speed = 100

    // Get color based on enemy type
    let color = '#ef4444' // red for normal
    if (enemy.type === 'elite') color = '#f97316' // orange for elite
    if (enemy.type === 'boss') color = '#a855f7' // purple for boss

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      }
      this.spawnParticle(
        enemy.position,
        velocity,
        color,
        enemy.size / 4, // Particle size based on enemy size
        0.5, // 0.5 second lifetime
        currentTime
      )
    }
  }

  private updateParticles(deltaTime: number, currentTime: number) {
    const particles = this.state.particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      const age = (currentTime - particle.createdAt) / 1000

      // Remove if too old
      if (age > particle.lifetime) {
        particles.splice(i, 1)
        continue
      }

      // Update position
      particle.position.x += particle.velocity.x * deltaTime
      particle.position.y += particle.velocity.y * deltaTime

      // Apply friction
      particle.velocity.x *= 0.95
      particle.velocity.y *= 0.95
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
