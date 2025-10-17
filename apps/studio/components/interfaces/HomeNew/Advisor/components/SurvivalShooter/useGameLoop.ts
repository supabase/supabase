import { useRef, useCallback, useEffect, useMemo } from 'react'
import type {
  GameState,
  GameStatus,
  Enemy,
  Projectile,
  Vector2,
  Card,
  PlayerStats,
  GameConfig,
  Weapon,
} from './types'
import { PerkType, WeaponType } from './types'

// Canvas will be dynamic, sized by the container
const CANVAS_WIDTH = 800 // default fallback
const CANVAS_HEIGHT = 600 // default fallback

const BASE_STATS: PlayerStats = {
  maxHp: 100,
  currentHp: 100,
  moveSpeed: 150, // pixels per second
  attackSpeed: 2, // attacks per second
  attackDamage: 3,
  projectileCount: 1,
  projectileSize: 1,
  pulseEnabled: false,
}

export const useGameLoop = (selectedCards: Card[], canvasSize: { width: number; height: number }) => {
  const gameStateRef = useRef<GameState | null>(null)
  const keysPressed = useRef<Set<string>>(new Set())
  const animationFrameId = useRef<number | null>(null)
  const lastFrameTime = useRef<number>(0)
  const enemyIdCounter = useRef(0)
  const projectileIdCounter = useRef(0)

  // Recalculate config whenever canvas size changes
  const config: GameConfig = useMemo(() => ({
    canvasWidth: canvasSize.width || CANVAS_WIDTH,
    canvasHeight: canvasSize.height || CANVAS_HEIGHT,
    playerRadius: 8,
    enemySize: 12,
    projectileRadius: 3,
    basePlayerStats: BASE_STATS,
  }), [canvasSize.width, canvasSize.height])

  // Calculate dynamic player radius based on HP
  const getPlayerRadius = useCallback((maxHp: number): number => {
    const baseRadius = 8
    const hpMultiplier = maxHp / 100
    return baseRadius * Math.sqrt(hpMultiplier)
  }, [])

  // Base weapon configurations
  const BASE_WEAPONS = {
    NORMAL: {
      type: WeaponType.NORMAL,
      baseDamage: 3,
      baseFireRate: 2,
      baseProjectileCount: 1,
      baseProjectileSpeed: 300,
      visuals: { color: '#fbbf24', size: 1 }, // yellow
    },
    RING: {
      type: WeaponType.RING,
      baseDamage: 1.5,
      baseFireRate: 0.5,
      baseProjectileCount: 1,
      baseProjectileSpeed: 0,
      visuals: { color: '#a78bfa', size: 1 }, // purple
    },
  }

  // Calculate weapon stats with modifiers applied
  const calculateWeaponStats = useCallback((baseWeapon: typeof BASE_WEAPONS.NORMAL, modifiers: any): Weapon => {
    return {
      id: `${baseWeapon.type}_weapon`,
      type: baseWeapon.type,
      damage: baseWeapon.baseDamage * modifiers.damageMultiplier,
      fireRate: baseWeapon.baseFireRate * modifiers.fireRateMultiplier,
      projectileCount: baseWeapon.baseProjectileCount + modifiers.projectileCountBonus,
      projectileSpeed: baseWeapon.baseProjectileSpeed,
      visuals: {
        ...baseWeapon.visuals,
        size: baseWeapon.visuals.size * modifiers.projectileSizeMultiplier,
      },
      lastFireTime: 0,
      projectileAngles: [],
    }
  }, [])

  // Calculate modifiers from selected items
  const calculateModifiers = useCallback((cards: Card[]) => {
    const modifiers = {
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      projectileCountBonus: 0,
      projectileSizeMultiplier: 1.0,
    }

    cards.forEach((card) => {
      card.perks.forEach((perk) => {
        switch (perk.type) {
          case PerkType.ATTACK_SPEED:
            modifiers.fireRateMultiplier *= 1 + perk.value / 100
            break
          case PerkType.ATTACK_DAMAGE:
            modifiers.damageMultiplier *= 1 + perk.value / 100
            break
          case PerkType.PROJECTILE_COUNT:
            modifiers.projectileCountBonus += perk.value
            break
          case PerkType.PROJECTILE_SIZE:
            modifiers.projectileSizeMultiplier += perk.value
            break
        }
      })
    })

    return modifiers
  }, [])

  // Create weapons based on selected items
  const createWeapons = useCallback((cards: Card[], modifiers: any): Weapon[] => {
    const weapons: Weapon[] = []

    // Always include NORMAL weapon
    weapons.push(calculateWeaponStats(BASE_WEAPONS.NORMAL, modifiers))

    // Check if RING weapon should be unlocked
    const hasRing = cards.some((card) =>
      card.perks.some((perk) => perk.type === PerkType.UNLOCK_RING)
    )

    if (hasRing) {
      weapons.push(calculateWeaponStats(BASE_WEAPONS.RING, modifiers))
    }

    return weapons
  }, [calculateWeaponStats])

  // Apply card perks to player stats (only HP now, other stats use modifiers)
  const getInitialPlayerStats = useCallback((): PlayerStats => {
    let stats = { ...BASE_STATS }

    selectedCards.forEach((card) => {
      card.perks.forEach((perk) => {
        switch (perk.type) {
          case PerkType.HP_INCREASE:
            stats.maxHp += perk.value
            stats.currentHp += perk.value
            break
        }
      })
    })

    return stats
  }, [selectedCards])

  const initializeGame = useCallback(() => {
    const stats = getInitialPlayerStats()
    const modifiers = calculateModifiers(selectedCards)
    const weapons = createWeapons(selectedCards, modifiers)

    gameStateRef.current = {
      status: 'playing' as GameStatus,
      player: {
        position: { x: config.canvasWidth / 2, y: config.canvasHeight / 2 },
        rotation: 0,
        stats,
        modifiers,
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
      selectedCards,
      availableCards: [],
      mousePosition: null,
    }

    lastFrameTime.current = performance.now()
    enemyIdCounter.current = 0
    projectileIdCounter.current = 0
  }, [getInitialPlayerStats, calculateModifiers, createWeapons, selectedCards, config])

  const spawnEnemy = useCallback((currentTime: number, waveNumber: number): Enemy => {
    const id = `enemy_${enemyIdCounter.current++}`
    const angle = Math.random() * Math.PI * 2
    const baseHp = 20
    const baseSpeed = 40
    const speed = baseSpeed + waveNumber * 2

    // Calculate spawn position on canvas edge
    const centerX = config.canvasWidth / 2
    const centerY = config.canvasHeight / 2
    const spawnDistance = Math.max(config.canvasWidth, config.canvasHeight) * 0.7

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
  }, [config])

  // Find the biggest gap between angles and return the angle in the middle of that gap
  const findBiggestGap = useCallback((angles: number[]): number => {
    if (angles.length === 0) return 0
    if (angles.length === 1) return (angles[0] + Math.PI) % (Math.PI * 2)

    // Sort angles
    const sorted = [...angles].sort((a, b) => a - b)

    let maxGap = 0
    let maxGapIndex = 0

    // Check gaps between consecutive angles
    for (let i = 0; i < sorted.length; i++) {
      const nextIndex = (i + 1) % sorted.length
      const gap = nextIndex === 0
        ? (Math.PI * 2 - sorted[i] + sorted[0])
        : (sorted[nextIndex] - sorted[i])

      if (gap > maxGap) {
        maxGap = gap
        maxGapIndex = i
      }
    }

    // Return angle in the middle of the biggest gap
    const nextIndex = (maxGapIndex + 1) % sorted.length
    if (nextIndex === 0) {
      return (sorted[maxGapIndex] + maxGap / 2) % (Math.PI * 2)
    } else {
      return sorted[maxGapIndex] + maxGap / 2
    }
  }, [])

  const shootWeapons = useCallback((currentTime: number) => {
    if (!gameStateRef.current) return

    const { player, projectiles } = gameStateRef.current

    // Fire each weapon independently
    player.weapons.forEach((weapon) => {
      const fireInterval = 1000 / weapon.fireRate
      if (currentTime - weapon.lastFireTime < fireInterval) return

      weapon.lastFireTime = currentTime

      // Handle different weapon types
      if (weapon.type === WeaponType.RING) {
        // Ring weapon: expanding ring
        projectiles.push({
          id: `projectile_${projectileIdCounter.current++}`,
          position: { x: player.position.x, y: player.position.y },
          velocity: { x: 0, y: 0 },
          angle: 0,
          damage: weapon.damage,
          radius: config.playerRadius,
          weaponType: weapon.type,
          isPulse: true,
          createdAt: currentTime,
        })
      } else {
        // Normal weapon: standard projectiles
        const count = Math.floor(weapon.projectileCount)

        // Ensure we have the right number of projectile angles
        while (weapon.projectileAngles.length < count) {
          const newAngle = findBiggestGap(weapon.projectileAngles)
          weapon.projectileAngles.push(newAngle)
        }

        // Shoot projectiles at each angle (relative to player rotation)
        weapon.projectileAngles.forEach((relativeAngle) => {
          const actualAngle = relativeAngle + player.rotation
          const velocity: Vector2 = {
            x: Math.cos(actualAngle) * weapon.projectileSpeed,
            y: Math.sin(actualAngle) * weapon.projectileSpeed,
          }

          projectiles.push({
            id: `projectile_${projectileIdCounter.current++}`,
            position: { x: player.position.x, y: player.position.y },
            velocity,
            angle: actualAngle,
            damage: weapon.damage,
            radius: config.projectileRadius * weapon.visuals.size,
            weaponType: weapon.type,
            isPulse: false,
          })
        })
      }
    })
  }, [findBiggestGap, config])

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

    // Update positions and remove off-screen projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i]

      if (proj.isPulse) {
        // Expand pulse projectile
        const age = (currentTime - (proj.createdAt || 0)) / 1000
        const expansionSpeed = 150 // pixels per second
        proj.radius = config.playerRadius + age * expansionSpeed

        // Remove pulse after 2 seconds or if too large
        if (age > 2 || proj.radius > Math.max(config.canvasWidth, config.canvasHeight)) {
          projectiles.splice(i, 1)
          continue
        }
      } else {
        // Move regular projectiles
        proj.position.x += proj.velocity.x * deltaTime
        proj.position.y += proj.velocity.y * deltaTime

        // Remove if off-screen
        if (
          proj.position.x > config.canvasWidth + 20 ||
          proj.position.x < -20 ||
          proj.position.y > config.canvasHeight + 20 ||
          proj.position.y < -20
        ) {
          projectiles.splice(i, 1)
        }
      }
    }
  }, [config])

  const updateEnemies = useCallback((deltaTime: number, currentTime: number) => {
    if (!gameStateRef.current) return

    const { enemies, wave, player } = gameStateRef.current

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

      if (distance < playerRadius + config.enemySize / 2) {
        player.stats.currentHp -= enemy.damage
        enemies.splice(i, 1)
        continue
      }
    }
  }, [spawnEnemy, getPlayerRadius, config])

  const checkCollisions = useCallback(() => {
    if (!gameStateRef.current) return

    const { enemies, projectiles, player } = gameStateRef.current

    // Check projectile-enemy collisions
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i]
      let hit = false

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
          isColliding = Math.abs(distanceFromCenter - proj.radius) < ringThickness + config.enemySize / 2
        } else {
          // Regular projectile collision
          const dx = proj.position.x - enemy.position.x
          const dy = proj.position.y - enemy.position.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          isColliding = distance < proj.radius + config.enemySize / 2
        }

        if (isColliding) {
          enemy.hp -= proj.damage
          hit = true

          if (enemy.hp <= 0) {
            enemies.splice(j, 1)
          }

          // Don't break for pulse - it can hit multiple enemies
          if (!proj.isPulse) {
            break
          }
        }
      }

      // Only remove non-pulse projectiles when they hit
      if (hit && !proj.isPulse) {
        projectiles.splice(i, 1)
      }
    }
  }, [config])

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
    [
      updatePlayer,
      shootWeapons,
      updateProjectiles,
      updateEnemies,
      checkCollisions,
      updateWave,
    ]
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
