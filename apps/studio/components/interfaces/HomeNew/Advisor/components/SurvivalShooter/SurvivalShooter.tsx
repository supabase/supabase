import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from 'ui'
import { X, Heart, Zap } from 'lucide-react'
import { SurvivalCanvas } from './SurvivalCanvas'
import { useGameLoop } from './useGameLoop'
import type { GameStatus, SelectedCard } from './types'
import { WeaponType } from './types'
import { ALL_ITEMS } from './items'
import type { GameItem } from './items/base'
import { KeyboardInput } from './input/keyboard'

interface SurvivalShooterProps {
  availableResources: number
  onExit: () => void
}

const getRandomItem = (): GameItem => {
  return ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)]
}

const weaponTypeLabels: Record<WeaponType, string> = {
  [WeaponType.NORMAL]: 'Blaster',
  [WeaponType.RING]: 'Ring Weapon',
  [WeaponType.SHOTGUN]: 'Shotgun',
  [WeaponType.FLAMETHROWER]: 'Flamethrower',
}

export const SurvivalShooter = ({ availableResources = 0, onExit }: SurvivalShooterProps) => {
  const maxCards = Math.max(0, availableResources)
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [currentOptions, setCurrentOptions] = useState<GameItem[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [enemiesKilled, setEnemiesKilled] = useState(0)
  const [experience, setExperience] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [gameStatus, setGameStatus] = useState<GameStatus>('card_selection' as GameStatus)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [weaponSelectionPrompt, setWeaponSelectionPrompt] = useState<{
    item: GameItem
    options: WeaponType[]
  } | null>(null)
  const [isSelectionActive, setIsSelectionActive] = useState(false)
  const [levelUpPending, setLevelUpPending] = useState(false)
  const [pendingLevelUpRewards, setPendingLevelUpRewards] = useState(0)
  const wasPlayingBeforeSelectionRef = useRef(false)
  const keyboardInputRef = useRef<KeyboardInput | null>(null)
  const lastProcessedLevelRef = useRef(1)

  const { gameStateRef, config, startGame, pauseGame, resumeGame, updateMousePosition, updateInputVector } =
    useGameLoop(selectedCards, canvasSize, maxCards)

  const remainingSelections = Math.max(0, maxCards - selectedCards.length)

  const unlockedWeapons = useMemo(() => {
    const weapons = new Set<WeaponType>([WeaponType.NORMAL])
    selectedCards.forEach((choice) => {
      if (choice.item.unlocksWeapon) {
        weapons.add(choice.item.unlocksWeapon)
      }
    })
    return weapons
  }, [selectedCards])

  const getWeaponOptions = (item: GameItem): WeaponType[] => {
    if (!item.requiresWeaponSelection) return []
    const allowedTypes = item.applicableWeaponTypes ?? []
    return allowedTypes.filter((type) => unlockedWeapons.has(type))
  }

  const addItemSelection = (item: GameItem, assignedWeaponType?: WeaponType) => {
    // Store only minimal item metadata in card (not the full item with functions)
    setSelectedCards((prev) => [
      ...prev,
      {
        item: {
          id: item.id,
          name: item.name,
          description: item.description,
          requiresWeaponSelection: item.requiresWeaponSelection,
          applicableWeaponTypes: item.applicableWeaponTypes,
          unlocksWeapon: item.unlocksWeapon,
          stackable: item.stackable,
        },
        assignedWeaponType,
      },
    ])
    setCurrentOptions([])

    // If this was a level-up reward, decrement pending rewards
    if (levelUpPending && pendingLevelUpRewards > 0) {
      setPendingLevelUpRewards((prev) => prev - 1)
      if (pendingLevelUpRewards <= 1) {
        setLevelUpPending(false)
      }
    }
  }

  // Initialize keyboard input
  useEffect(() => {
    const keyboard = new KeyboardInput()
    keyboard.start()
    keyboardInputRef.current = keyboard

    return () => {
      keyboard.stop()
    }
  }, [])

  // Update input vector from keyboard
  useEffect(() => {
    if (!hasStarted || !keyboardInputRef.current) return

    const interval = setInterval(() => {
      if (keyboardInputRef.current && gameStateRef.current?.status === 'playing') {
        const inputVector = keyboardInputRef.current.getMovementVector()
        updateInputVector(inputVector)
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [hasStarted, updateInputVector, gameStateRef])

  // Monitor game state
  useEffect(() => {
    if (!hasStarted) return

    const interval = setInterval(() => {
      if (gameStateRef.current) {
        setGameStatus(gameStateRef.current.status)
        setCurrentScore(gameStateRef.current.score)
        setEnemiesKilled(gameStateRef.current.enemiesKilled)
        setExperience(gameStateRef.current.experience)
        setCurrentLevel(gameStateRef.current.currentLevel)

        // Detect level ups
        if (gameStateRef.current.currentLevel > lastProcessedLevelRef.current) {
          const levelDifference = gameStateRef.current.currentLevel - lastProcessedLevelRef.current
          lastProcessedLevelRef.current = gameStateRef.current.currentLevel
          setLevelUpPending(true)
          setPendingLevelUpRewards((prev) => prev + levelDifference)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [hasStarted, gameStateRef])

  useEffect(() => {
    const totalSelections = remainingSelections + pendingLevelUpRewards

    if (totalSelections > 0 || levelUpPending) {
      if (!isSelectionActive) {
        setIsSelectionActive(true)
        setCurrentOptions([])
        const status = gameStateRef.current?.status
        if (status === 'playing') {
          pauseGame()
          wasPlayingBeforeSelectionRef.current = true
        } else if (levelUpPending) {
          // Level up paused the game, we should resume after selection
          wasPlayingBeforeSelectionRef.current = true
        } else {
          wasPlayingBeforeSelectionRef.current = false
        }
      }
    } else {
      if (isSelectionActive) {
        setIsSelectionActive(false)
        setCurrentOptions([])
        if (!hasStarted) {
          setHasStarted(true)
          startGame()
        } else if (wasPlayingBeforeSelectionRef.current) {
          resumeGame()
        }
        wasPlayingBeforeSelectionRef.current = false
      } else if (!hasStarted && maxCards === 0) {
        setHasStarted(true)
        startGame()
      }
    }
  }, [
    remainingSelections,
    pendingLevelUpRewards,
    levelUpPending,
    isSelectionActive,
    pauseGame,
    resumeGame,
    startGame,
    hasStarted,
    maxCards,
    gameStateRef,
  ])

  useEffect(() => {
    if (!isSelectionActive) {
      setWeaponSelectionPrompt(null)
    }
  }, [isSelectionActive])

  useEffect(() => {
    const hasRingUnlocked = selectedCards.some(
      (choice) => choice.item.unlocksWeapon === WeaponType.RING
    )
    if (hasRingUnlocked) return

    const filtered = selectedCards.filter((choice) => choice.assignedWeaponType !== WeaponType.RING)
    if (filtered.length !== selectedCards.length) {
      setSelectedCards(filtered)
    }
  }, [selectedCards])

  useEffect(() => {
    if (!isSelectionActive) {
      setCurrentOptions([])
      return
    }

    if (weaponSelectionPrompt) return

    const totalSelections = remainingSelections + pendingLevelUpRewards
    if (totalSelections <= 0) {
      setCurrentOptions([])
      return
    }

    if (currentOptions.length === 0) {
      const optionCount = 3 // Always show 3 options to choose from
      const selectedNonStackableIds = new Set(
        selectedCards
          .filter((choice) => choice.item.stackable === false)
          .map((choice) => choice.item.id)
      )

      // Generate options, filtering out already-selected non-stackable items
      const options: GameItem[] = []
      let attempts = 0
      const maxAttempts = 100 // prevent infinite loop

      while (options.length < optionCount && attempts < maxAttempts) {
        const item = getRandomItem()
        attempts++

        // Skip if non-stackable and already selected
        if (item.stackable === false && selectedNonStackableIds.has(item.id)) {
          continue
        }

        // Skip if already in current options (avoid duplicate cards in same draw)
        if (options.some((opt) => opt.id === item.id)) {
          continue
        }

        options.push(item)
      }

      setCurrentOptions(options)
    }
  }, [
    isSelectionActive,
    weaponSelectionPrompt,
    remainingSelections,
    pendingLevelUpRewards,
    currentOptions.length,
    selectedCards,
  ])

  const handleItemSelect = (item: GameItem) => {
    if (!isSelectionActive || weaponSelectionPrompt) return
    const totalSelections = remainingSelections + pendingLevelUpRewards
    if (totalSelections <= 0) return

    // Check if item is already selected and not stackable
    const stackable = item.stackable !== false // defaults to true if undefined
    if (!stackable && selectedCards.some((choice) => choice.item.id === item.id)) {
      return // Can't select non-stackable item twice
    }

    if (item.requiresWeaponSelection) {
      const options = getWeaponOptions(item)
      if (options.length === 0) return
      if (options.length === 1) {
        addItemSelection(item, options[0])
      } else {
        setWeaponSelectionPrompt({ item, options })
      }
      return
    }

    addItemSelection(item)
  }

  const handleWeaponSelection = (weapon: WeaponType) => {
    if (!weaponSelectionPrompt) return
    addItemSelection(weaponSelectionPrompt.item, weapon)
    setWeaponSelectionPrompt(null)
  }

  const handleRestart = () => {
    setHasStarted(false)
    setSelectedCards([])
    setCurrentOptions([])
    setGameStatus('card_selection' as GameStatus)
    setWeaponSelectionPrompt(null)
    setEnemiesKilled(0)
    setExperience(0)
    setCurrentLevel(1)
    setLevelUpPending(false)
    setPendingLevelUpRewards(0)
    lastProcessedLevelRef.current = 1
    wasPlayingBeforeSelectionRef.current = false
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getExperienceForLevel = (level: number): number => {
    return (level - 1) * (level - 1) * 5
  }

  const getExperienceProgress = () => {
    const currentLevelExp = getExperienceForLevel(currentLevel)
    const nextLevelExp = getExperienceForLevel(currentLevel + 1)
    const expInCurrentLevel = experience - currentLevelExp
    const expNeededForLevel = nextLevelExp - currentLevelExp
    return {
      current: expInCurrentLevel,
      needed: expNeededForLevel,
      percentage: expNeededForLevel > 0 ? (expInCurrentLevel / expNeededForLevel) * 100 : 0,
    }
  }

  const renderSelectionOverlay = isSelectionActive ? (
    <div className="absolute inset-0 bg-surface-100/95 backdrop-blur-md z-20 flex">
      <Button
        onClick={onExit}
        type="default"
        size="tiny"
        className="absolute top-4 right-4 z-10"
        icon={<X strokeWidth={1} size={16} />}
      />
      {!weaponSelectionPrompt ? (
        <>
          {currentOptions.map((item) => {
            const weaponOptions = getWeaponOptions(item)
            const stackable = item.stackable !== false
            const alreadySelected =
              !stackable && selectedCards.some((choice) => choice.item.id === item.id)
            const isDisabled =
              alreadySelected || (item.requiresWeaponSelection && weaponOptions.length === 0)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemSelect(item)}
                disabled={isDisabled}
                className={`flex-1 flex flex-col items-center justify-center border-r border-overlay last:border-r-0 transition-all ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-brand/10 cursor-pointer'
                }`}
              >
                <div className="text-center px-8">
                  <div className="text-2xl font-medium mb-3">{item.name}</div>
                  <div className="text-base text-foreground-light">{item.description}</div>
                  {alreadySelected && (
                    <div className="text-sm text-foreground-muted mt-4">Already unlocked</div>
                  )}
                  {!alreadySelected &&
                    item.requiresWeaponSelection &&
                    weaponOptions.length === 0 && (
                      <div className="text-sm text-foreground-muted mt-4">
                        Unlock a compatible weapon to use this item
                      </div>
                    )}
                </div>
              </button>
            )
          })}
          {currentOptions.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-foreground-muted">
              Generating items...
            </div>
          )}
        </>
      ) : (
        <>
          {weaponSelectionPrompt.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleWeaponSelection(option)}
              className="flex-1 flex flex-col items-center justify-center border-r border-overlay last:border-r-0 hover:bg-brand/10 transition-all cursor-pointer"
            >
              <div className="text-center px-8">
                <div className="text-2xl font-medium">{weaponTypeLabels[option]}</div>
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  ) : null

  // Game over screen
  if (gameStatus === 'game_over') {
    return (
      <div className="w-full h-full relative overflow-hidden bg-alternative">
        <Button
          onClick={onExit}
          type="default"
          size="tiny"
          className="absolute top-4 right-4 z-10"
          icon={<X strokeWidth={1} size={16} />}
        />

        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2">Game Over</h2>
            <div className="text-3xl font-mono font-bold text-brand mb-1">
              {formatTime(currentScore)}
            </div>
            <p className="text-sm text-foreground-light">Time Survived</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleRestart} size="small" type="primary">
              Play Again
            </Button>
            <Button onClick={onExit} size="small" type="default">
              Exit
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Playing screen
  return (
    <div className="w-full h-full relative overflow-hidden">
      <Button
        onClick={onExit}
        type="default"
        size="tiny"
        className="absolute top-4 right-4 z-10"
        icon={<X strokeWidth={1} size={16} />}
      />

      {/* HUD - Top left corner */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4 font-mono text-sm text-foreground">
        {/* HP */}
        <div className="flex items-center gap-1.5">
          <Heart strokeWidth={1.5} size={16} className="text-red-500" />
          <span>
            {Math.max(0, Math.floor(gameStateRef.current?.player.stats.currentHp || 0))} /{' '}
            {gameStateRef.current?.player.stats.maxHp || 100}
          </span>
        </div>

        {/* Enemy Kill Count */}
        <div className="flex items-center gap-1.5">
          <Zap strokeWidth={1.5} size={16} className="text-yellow-500" />
          <span>{enemiesKilled}</span>
        </div>

        {/* Experience Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Lv.{currentLevel}</span>
          <div className="w-32 h-2 bg-overlay rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${getExperienceProgress().percentage}%` }}
            />
          </div>
          <span className="text-xs text-foreground-light">
            {getExperienceProgress().current}/{getExperienceProgress().needed}
          </span>
        </div>
      </div>

      <SurvivalCanvas
        gameStateRef={gameStateRef}
        config={config}
        onMouseMove={updateMousePosition}
        onResize={setCanvasSize}
      />
      {renderSelectionOverlay}
    </div>
  )
}
