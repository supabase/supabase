import { useRef, useCallback, useEffect, useMemo } from 'react'
import type {
  GameState,
  GameStatus,
  Enemy,
  Projectile,
  Vector2,
  PlayerStats,
  GameConfig,
  Weapon,
  SelectedCard,
  WeaponModifiers,
} from './types'
import { WeaponType } from './types'
import { getWeaponByType } from './weapons'
import type { GameItem } from './items/base'
import { getItemById } from './items'

// Canvas will be dynamic, sized by the container
const CANVAS_WIDTH = 800 // default fallback
const CANVAS_HEIGHT = 600 // default fallback

const BASE_STATS: PlayerStats = {
  maxHp: 100,
  currentHp: 100,
  moveSpeed: 150, // pixels per second
  attackSpeed: 2, // attacks per second
  attackDamage: 5,
  projectileCount: 1,
  projectileSize: 1,
  pulseEnabled: false,
}

export const useGameLoop = (
  selectedCards: SelectedCard[],
  canvasSize: { width: number; height: number },
  maxSelectableItems: number
) => {
  const gameStateRef = useRef<GameState | null>(null)
  const animationFrameId = useRef<number | null>(null)
  const lastFrameTime = useRef<number>(0)
  const enemyIdCounter = useRef(0)
  const projectileIdCounter = useRef(0)
  const configRef = useRef<GameConfig>({
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    playerRadius: 8,
    enemySize: 12,
    projectileRadius: 3,
    basePlayerStats: BASE_STATS,
  })

  // Recalculate config whenever canvas size changes
  const config: GameConfig = useMemo(
    () => ({
      canvasWidth: canvasSize.width || CANVAS_WIDTH,
      canvasHeight: canvasSize.height || CANVAS_HEIGHT,
      playerRadius: 8,
      enemySize: 12,
      projectileRadius: 3,
      basePlayerStats: BASE_STATS,
    }),
    [canvasSize.width, canvasSize.height]
  )

  const itemLimit = Math.max(0, Math.floor(maxSelectableItems || 0))
  const cardsForGame = useMemo(() => selectedCards.slice(0, itemLimit), [selectedCards, itemLimit])

  useEffect(() => {
    configRef.current = config
  }, [config])

  // Calculate dynamic player radius based on HP
  const getPlayerRadius = useCallback((maxHp: number): number => {
    const baseRadius = 8
    const hpMultiplier = maxHp / 100
    return baseRadius * Math.sqrt(hpMultiplier)
  }, [])

  // Collect applied items per weapon type
  const collectAppliedItems = useCallback((choices: SelectedCard[]) => {
    const appliedItems: Record<WeaponType, GameItem[]> = {
      [WeaponType.NORMAL]: [],
      [WeaponType.RING]: [],
    }

    const unlockedWeapons = new Set<WeaponType>([WeaponType.NORMAL])

    choices.forEach((choice) => {
      // Get the full GameItem from registry
      const gameItem = getItemById(choice.item.id)
      if (!gameItem) return

      // Check if this item unlocks a weapon
      if (gameItem.unlocksWeapon) {
        unlockedWeapons.add(gameItem.unlocksWeapon)
      }

      // Add item to appropriate weapons
      if (choice.item.requiresWeaponSelection && choice.assignedWeaponType) {
        appliedItems[choice.assignedWeaponType].push(gameItem)
      }
    })

    return { appliedItems, unlockedWeapons }
  }, [])

  const createWeapons = useCallback(
    (appliedItems: Record<WeaponType, GameItem[]>, unlockedWeapons: Set<WeaponType>): Weapon[] => {
      const weapons: Weapon[] = []

      // Always create normal weapon
      const normalWeapon = getWeaponByType(WeaponType.NORMAL)
      const normalStats = normalWeapon.calculateStats(appliedItems[WeaponType.NORMAL])
      weapons.push({
        id: `${WeaponType.NORMAL}_weapon`,
        type: WeaponType.NORMAL,
        damage: normalStats.damage,
        fireRate: normalStats.fireRate,
        projectileCount: normalStats.projectileCount,
        projectileSpeed: normalStats.projectileSpeed,
        visuals: normalStats.visuals,
        lastFireTime: 0,
        projectileAngles: [],
        appliedItems: [], // Keep for backwards compatibility, but not used anymore
      })

      // Create ring weapon if unlocked
      if (unlockedWeapons.has(WeaponType.RING)) {
        const ringWeapon = getWeaponByType(WeaponType.RING)
        const ringStats = ringWeapon.calculateStats(appliedItems[WeaponType.RING])
        weapons.push({
          id: `${WeaponType.RING}_weapon`,
          type: WeaponType.RING,
          damage: ringStats.damage,
          fireRate: ringStats.fireRate,
          projectileCount: ringStats.projectileCount,
          projectileSpeed: ringStats.projectileSpeed,
          visuals: ringStats.visuals,
          lastFireTime: 0,
          projectileAngles: [],
          appliedItems: [],
        })
      }

      return weapons
    },
    []
  )

  // Apply items to player stats
  const getInitialPlayerStats = useCallback((choices: SelectedCard[]): PlayerStats => {
    let stats = { ...BASE_STATS }

    choices.forEach((choice) => {
      const gameItem = getItemById(choice.item.id)
      if (gameItem?.statModifiers?.maxHp) {
        stats.maxHp += gameItem.statModifiers.maxHp
        stats.currentHp += gameItem.statModifiers.maxHp
      }
    })

    return stats
  }, [])

  const initializeGame = useCallback(() => {
    const stats = getInitialPlayerStats(cardsForGame)
    const { appliedItems, unlockedWeapons } = collectAppliedItems(cardsForGame)
    const weapons = createWeapons(appliedItems, unlockedWeapons)
    const currentConfig = configRef.current

    gameStateRef.current = {
      status: 'playing' as GameStatus,
      player: {
        position: { x: currentConfig.canvasWidth / 2, y: currentConfig.canvasHeight / 2 },
        rotation: 0,
        stats,
        modifiers: {
          damageMultiplier: 1.0,
          fireRateMultiplier: 1.0,
          projectileCountBonus: 0,
          projectileSizeMultiplier: 1.0,
        },
        weapons,
        lastAttackTime: 0,
        lastPulseTime: 0,
        projectileAngles: [],
      },
      enemies: [],
      projectiles: [],
      wave: {
        waveNumber: 1,
        enemiesRemaining: 0,
        spawnRate: 0.5, // enemies per second
        lastSpawnTime: 0,
      },
      score: 0,
      selectedCards: cardsForGame,
      mousePosition: null,
      maxSelectableItems: itemLimit,
    }

    lastFrameTime.current = performance.now()
    enemyIdCounter.current = 0
    projectileIdCounter.current = 0
  }, [cardsForGame, itemLimit, getInitialPlayerStats, collectAppliedItems, createWeapons])

  useEffect(() => {
    if (!gameStateRef.current) return

    const currentState = gameStateRef.current
    const { appliedItems, unlockedWeapons } = collectAppliedItems(cardsForGame)
    const updatedWeapons = createWeapons(appliedItems, unlockedWeapons)

    updatedWeapons.forEach((weapon) => {
      const existing = currentState.player.weapons.find((w) => w.type === weapon.type)
      if (existing) {
        weapon.lastFireTime = existing.lastFireTime
        weapon.projectileAngles = existing.projectileAngles
      }
    })

    const stats = getInitialPlayerStats(cardsForGame)
    const previousMaxHp = currentState.player.stats.maxHp
    const hpDiff = stats.maxHp - previousMaxHp

    currentState.player.stats.maxHp = stats.maxHp
    if (hpDiff > 0) {
      currentState.player.stats.currentHp = Math.min(
        stats.maxHp,
        currentState.player.stats.currentHp + hpDiff
      )
    } else {
      currentState.player.stats.currentHp = Math.min(
        currentState.player.stats.currentHp,
        stats.maxHp
      )
    }

    currentState.player.weapons = updatedWeapons
    currentState.selectedCards = cardsForGame
  }, [cardsForGame, collectAppliedItems, createWeapons, getInitialPlayerStats])

  const spawnEnemy = useCallback((currentTime: number, waveNumber: number): Enemy => {
    const currentConfig = configRef.current
    const id = `enemy_${enemyIdCounter.current++}`
    const angle = Math.random() * Math.PI * 2
    const baseHp = 20
    const baseSpeed = 40
    const speed = baseSpeed + waveNumber * 2

    // Calculate spawn position on canvas edge
    const centerX = currentConfig.canvasWidth / 2
    const centerY = currentConfig.canvasHeight / 2
    const spawnDistance = Math.max(currentConfig.canvasWidth, currentConfig.canvasHeight) * 0.7

    const spawnX = centerX + Math.cos(angle) * spawnDistance
    const spawnY = centerY + Math.sin(angle) * spawnDistance

    // Calculate velocity towards center
    const dx = centerX - spawnX
    const dy = centerY - spawnY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const velocity: Vector2 = {
      x: (dx / distance) * speed,
      y: (dy / distance) * speed,
    }

    return {
      id,
      position: { x: spawnX, y: spawnY },
      velocity,
      hp: baseHp + waveNumber * 5,
      maxHp: baseHp + waveNumber * 5,
      speed,
      damage: 10 + waveNumber * 2,
    }
  }, [])

  const shootWeapons = useCallback((currentTime: number) => {
    if (!gameStateRef.current) return

    const { player, projectiles, selectedCards } = gameStateRef.current
    const currentConfig = configRef.current

    // Fire each weapon independently using weapon.shoot()
    player.weapons.forEach((weapon) => {
      const gameWeapon = getWeaponByType(weapon.type)
      const result = gameWeapon.shoot(
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
            playerRadius: currentConfig.playerRadius,
            projectileRadius: currentConfig.projectileRadius,
          },
          projectileIdCounter,
        },
        weapon.lastFireTime,
        weapon.projectileAngles
      )

      if (result) {
        weapon.lastFireTime = result.lastFireTime
        projectiles.push(...result.projectiles)
      }
    })
  }, [])

  const updatePlayer = useCallback(() => {
    if (!gameStateRef.current) return

    const { player, mousePosition } = gameStateRef.current

    // Update rotation based on mouse position
    if (mousePosition) {
      const dx = mousePosition.x - player.position.x
      const dy = mousePosition.y - player.position.y
      player.rotation = Math.atan2(dy, dx)
    }
  }, [])

  const updateProjectiles = useCallback((deltaTime: number, currentTime: number) => {
    if (!gameStateRef.current) return

    const { projectiles } = gameStateRef.current
    const currentConfig = configRef.current

    // Update positions and remove off-screen projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i]

      if (proj.isPulse) {
        // Expand pulse projectile
        const age = (currentTime - (proj.createdAt || 0)) / 1000
        const expansionSpeed = 150 // pixels per second
        proj.radius = currentConfig.playerRadius + age * expansionSpeed

        // Remove pulse after 2 seconds or if too large
        if (
          age > 2 ||
          proj.radius > Math.max(currentConfig.canvasWidth, currentConfig.canvasHeight)
        ) {
          projectiles.splice(i, 1)
          continue
        }
      } else {
        // Move regular projectiles
        proj.position.x += proj.velocity.x * deltaTime
        proj.position.y += proj.velocity.y * deltaTime

        // Remove if off-screen
        if (
          proj.position.x > currentConfig.canvasWidth + 20 ||
          proj.position.x < -20 ||
          proj.position.y > currentConfig.canvasHeight + 20 ||
          proj.position.y < -20
        ) {
          projectiles.splice(i, 1)
        }
      }
    }
  }, [])

  const updateEnemies = useCallback(
    (deltaTime: number, currentTime: number) => {
      if (!gameStateRef.current) return

      const { enemies, wave, player } = gameStateRef.current
      const currentConfig = configRef.current

      // Spawn enemies
      const spawnInterval = 1000 / wave.spawnRate
      if (currentTime - wave.lastSpawnTime > spawnInterval) {
        enemies.push(spawnEnemy(currentTime, wave.waveNumber))
        wave.lastSpawnTime = currentTime
      }

      // Update enemy positions
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]

        // Recalculate velocity towards player's current position each frame
        const dx = player.position.x - enemy.position.x
        const dy = player.position.y - enemy.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Update velocity to always move towards player
        if (distance > 0) {
          enemy.velocity.x = (dx / distance) * enemy.speed
          enemy.velocity.y = (dy / distance) * enemy.speed
        }

        // Move enemy using velocity vector
        enemy.position.x += enemy.velocity.x * deltaTime
        enemy.position.y += enemy.velocity.y * deltaTime

        // Check collision with player (using dynamic radius based on HP)
        const playerRadius = getPlayerRadius(player.stats.maxHp)

        if (distance < playerRadius + currentConfig.enemySize / 2) {
          player.stats.currentHp -= enemy.damage
          enemies.splice(i, 1)
          continue
        }
      }
    },
    [spawnEnemy, getPlayerRadius]
  )

  const triggerDamageEvents = useCallback(
    (
      weaponType: WeaponType,
      damageDealt: number,
      enemy: Enemy,
      projectile: Projectile,
      wasLethal: boolean,
      defaultRemove: boolean
    ): boolean => {
      const state = gameStateRef.current
      if (!state || damageDealt <= 0) {
        return defaultRemove
      }

      const { player, selectedCards } = state

      // Get applied items for this weapon
      const { appliedItems } = collectAppliedItems(selectedCards)
      const weaponItems = appliedItems[weaponType]

      // Get event handlers from weapon
      const gameWeapon = getWeaponByType(weaponType)
      const eventHandlers = gameWeapon.getEventHandlers(weaponItems)

      // Trigger onDamage event
      if (eventHandlers.onDamage) {
        const context: OnDamageContext = {
          weaponType,
          damageDealt,
          enemy,
          projectile,
          player,
          wasLethal,
        }

        const result = eventHandlers.onDamage(context)
        if (result) {
          // Apply heal if any
          if (result.healAmount && result.healAmount > 0) {
            player.stats.currentHp = Math.min(
              player.stats.maxHp,
              player.stats.currentHp + result.healAmount
            )
          }

          // Use custom shouldRemoveProjectile if provided
          if (result.shouldRemoveProjectile !== undefined) {
            return result.shouldRemoveProjectile
          }
        }
      }

      return defaultRemove
    },
    [collectAppliedItems]
  )

  const checkCollisions = useCallback(() => {
    if (!gameStateRef.current) return

    const { enemies, projectiles, player } = gameStateRef.current
    const currentConfig = configRef.current

    // Check projectile-enemy collisions
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i]
      let hit = false
      let shouldRemoveProjectile = !proj.isPulse

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j]

        let isColliding = false

        if (proj.isPulse) {
          // For pulse, check if enemy is within the expanding ring
          const dx = enemy.position.x - player.position.x
          const dy = enemy.position.y - player.position.y
          const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

          // Check if enemy is touching the pulse ring (within a small threshold)
          const ringThickness = 20
          isColliding =
            Math.abs(distanceFromCenter - proj.radius) < ringThickness + currentConfig.enemySize / 2
        } else {
          // Regular projectile collision
          const dx = proj.position.x - enemy.position.x
          const dy = proj.position.y - enemy.position.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          isColliding = distance < proj.radius + currentConfig.enemySize / 2
        }

        if (isColliding) {
          const preHp = enemy.hp
          const damageDealt = Math.min(proj.damage, preHp)
          const remainingHp = preHp - proj.damage
          const wasLethal = remainingHp <= 0

          shouldRemoveProjectile = triggerDamageEvents(
            proj.weaponType,
            damageDealt,
            enemy,
            proj,
            wasLethal,
            shouldRemoveProjectile
          )

          enemy.hp = remainingHp
          hit = true

          if (wasLethal) {
            enemies.splice(j, 1)
          }

          // Stop checking once the projectile should be removed
          if (shouldRemoveProjectile) {
            break
          }
        }
      }

      // Remove projectile only if the damage handlers say so
      if (hit && shouldRemoveProjectile) {
        projectiles.splice(i, 1)
      }
    }
  }, [triggerDamageEvents])

  const updateWave = useCallback((score: number) => {
    if (!gameStateRef.current) return

    const { wave } = gameStateRef.current

    // Increase difficulty every 10 seconds
    const newWaveNumber = Math.floor(score / 10) + 1
    if (newWaveNumber > wave.waveNumber) {
      wave.waveNumber = newWaveNumber
      wave.spawnRate = 0.5 + (newWaveNumber - 1) * 0.3
    }
  }, [])

  const gameLoop = useCallback(
    (currentTime: number) => {
      if (!gameStateRef.current || gameStateRef.current.status !== 'playing') {
        return
      }

      const deltaTime = Math.min((currentTime - lastFrameTime.current) / 1000, 0.1) // Cap at 100ms
      lastFrameTime.current = currentTime

      // Update score (time survived)
      gameStateRef.current.score += deltaTime

      // Update game state
      updatePlayer()
      shootWeapons(currentTime)
      updateProjectiles(deltaTime, currentTime)
      updateEnemies(deltaTime, currentTime)
      checkCollisions()
      updateWave(gameStateRef.current.score)

      // Check game over
      if (gameStateRef.current.player.stats.currentHp <= 0) {
        gameStateRef.current.status = 'game_over' as GameStatus
        gameStateRef.current.player.stats.currentHp = 0
      }

      animationFrameId.current = requestAnimationFrame(gameLoop)
    },
    [updatePlayer, shootWeapons, updateProjectiles, updateEnemies, checkCollisions, updateWave]
  )

  const startGame = useCallback(() => {
    initializeGame()
    lastFrameTime.current = performance.now()
    animationFrameId.current = requestAnimationFrame(gameLoop)
  }, [initializeGame, gameLoop])

  const pauseGame = useCallback(() => {
    if (gameStateRef.current) {
      gameStateRef.current.status = 'paused' as GameStatus
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }
  }, [])

  const resumeGame = useCallback(() => {
    if (gameStateRef.current && gameStateRef.current.status === 'paused') {
      gameStateRef.current.status = 'playing' as GameStatus
      lastFrameTime.current = performance.now()
      animationFrameId.current = requestAnimationFrame(gameLoop)
    }
  }, [gameLoop])

  const updateMousePosition = useCallback((x: number, y: number) => {
    if (gameStateRef.current) {
      gameStateRef.current.mousePosition = { x, y }
    }
  }, [])

  // Update player position when canvas size changes
  useEffect(() => {
    if (gameStateRef.current) {
      gameStateRef.current.player.position = {
        x: config.canvasWidth / 2,
        y: config.canvasHeight / 2,
      }
    }
  }, [config])

  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  return {
    gameStateRef,
    config,
    startGame,
    pauseGame,
    resumeGame,
    updateMousePosition,
  }
}
