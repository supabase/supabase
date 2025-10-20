import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { GameState, PlayerStats, GameConfig, SelectedCard } from './types'
import { GameStatus } from './types'
import { GameRuntime } from './engine/runtime'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

const BASE_STATS: PlayerStats = {
  maxHp: 100,
  currentHp: 100,
  moveSpeed: 150,
  attackSpeed: 2,
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
  const runtimeRef = useRef<GameRuntime | null>(null)
  const animationFrameId = useRef<number | null>(null)
  const lastFrameTime = useRef(0)
  const configRef = useRef<GameConfig>({
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    playerRadius: 8,
    enemySize: 12,
    projectileRadius: 3,
    basePlayerStats: BASE_STATS,
  })

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
  // Don't slice selectedCards - level-up items should also be applied
  const cardsForGame = useMemo(() => selectedCards, [selectedCards])

  const ensureRuntime = useCallback(() => {
    if (!runtimeRef.current) {
      runtimeRef.current = new GameRuntime(configRef.current, BASE_STATS)
    }
    return runtimeRef.current
  }, [])

  const initializeGame = useCallback(() => {
    const runtime = ensureRuntime()
    const nextState = runtime.initialize(cardsForGame, itemLimit)
    gameStateRef.current = nextState
    lastFrameTime.current = performance.now()
  }, [cardsForGame, ensureRuntime, itemLimit])

  const gameLoop = useCallback(
    (currentTime: number) => {
      const state = gameStateRef.current
      const runtime = runtimeRef.current
      if (!state || !runtime || state.status !== GameStatus.PLAYING) {
        return
      }

      const deltaTime = Math.min((currentTime - lastFrameTime.current) / 1000, 0.1)
      lastFrameTime.current = currentTime

      runtime.tick(deltaTime, currentTime)
      animationFrameId.current = requestAnimationFrame(gameLoop)
    },
    []
  )

  const startGame = useCallback(() => {
    initializeGame()
    animationFrameId.current = requestAnimationFrame(gameLoop)
  }, [initializeGame, gameLoop])

  const pauseGame = useCallback(() => {
    if (gameStateRef.current) {
      gameStateRef.current.status = GameStatus.PAUSED
    }
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }
  }, [])

  const resumeGame = useCallback(() => {
    const state = gameStateRef.current
    if (!state || state.status !== GameStatus.PAUSED) return

    state.status = GameStatus.PLAYING
    lastFrameTime.current = performance.now()
    animationFrameId.current = requestAnimationFrame(gameLoop)
  }, [gameLoop])

  const updateMousePosition = useCallback(
    (x: number, y: number) => {
      const runtime = ensureRuntime()
      runtime.setMousePosition({ x, y })
    },
    [ensureRuntime]
  )

  const updateInputVector = useCallback(
    (vector: { x: number; y: number }) => {
      const runtime = ensureRuntime()
      runtime.setInputVector(vector)
    },
    [ensureRuntime]
  )

  useEffect(() => {
    configRef.current = config
    runtimeRef.current?.updateConfig(config)

    if (gameStateRef.current) {
      gameStateRef.current.player.position = {
        x: config.canvasWidth / 2,
        y: config.canvasHeight / 2,
      }
    }
  }, [config])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime || !gameStateRef.current) return
    runtime.updateSelectedCards(cardsForGame, itemLimit)
  }, [cardsForGame, itemLimit])

  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
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
    updateInputVector,
  }
}
