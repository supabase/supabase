import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from 'ui'
import { X, Heart, Zap } from 'lucide-react'
import { SurvivalCanvas } from './SurvivalCanvas'
import { useGameLoop } from './useGameLoop'
import type { Card, GameStatus, SelectedCard } from './types'
import { PerkType, WeaponType } from './types'

interface SurvivalShooterProps {
  availableResources: number
  onExit: () => void
}

const allItemTypes = [
  {
    type: PerkType.HP_INCREASE,
    name: 'Health Potion',
    desc: '+30 HP',
    value: 30,
    requiresWeaponSelection: false,
  },
  {
    type: PerkType.ATTACK_SPEED,
    name: 'Attack Speed',
    desc: '+25% Attack Speed',
    value: 25,
    requiresWeaponSelection: true,
    applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
  },
  {
    type: PerkType.ATTACK_DAMAGE,
    name: 'Damage Boost',
    desc: '+25% Damage',
    value: 25,
    requiresWeaponSelection: true,
    applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
  },
  {
    type: PerkType.PROJECTILE_COUNT,
    name: 'Multishot',
    desc: '+1 Projectile',
    value: 1,
    requiresWeaponSelection: true,
    applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
  },
  {
    type: PerkType.PROJECTILE_SIZE,
    name: 'Big Shot',
    desc: '+50% Projectile Size',
    value: 0.5,
    requiresWeaponSelection: true,
    applicableWeaponTypes: [WeaponType.NORMAL, WeaponType.RING],
  },
  {
    type: PerkType.UNLOCK_RING,
    name: 'Ring Weapon',
    desc: 'Unlock Expanding Ring',
    value: 1,
    requiresWeaponSelection: false,
  },
] as const

const createRandomCard = (): Card => {
  const itemData = allItemTypes[Math.floor(Math.random() * allItemTypes.length)]
  const isStatBoost = itemData.type === PerkType.HP_INCREASE
  return {
    id: `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: itemData.name,
    description: itemData.desc,
    cardType: isStatBoost ? ('stat' as const) : ('weapon' as const),
    perks: [
      {
        type: itemData.type,
        name: itemData.name,
        description: itemData.desc,
        value: itemData.value,
      },
    ],
    requiresWeaponSelection: itemData.requiresWeaponSelection,
    applicableWeaponTypes: itemData.applicableWeaponTypes,
  }
}

const weaponTypeLabels: Record<WeaponType, string> = {
  [WeaponType.NORMAL]: 'Blaster',
  [WeaponType.RING]: 'Ring Weapon',
}

export const SurvivalShooter = ({ availableResources = 0, onExit }: SurvivalShooterProps) => {
  const maxCards = Math.max(0, availableResources)
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [currentOptions, setCurrentOptions] = useState<Card[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>('card_selection' as GameStatus)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [weaponSelectionPrompt, setWeaponSelectionPrompt] = useState<{
    card: Card
    options: WeaponType[]
  } | null>(null)
  const [isSelectionActive, setIsSelectionActive] = useState(false)
  const wasPlayingBeforeSelectionRef = useRef(false)

  const { gameStateRef, config, startGame, pauseGame, resumeGame, updateMousePosition } =
    useGameLoop(selectedCards, canvasSize, maxCards)

  const remainingSelections = Math.max(0, maxCards - selectedCards.length)

  const unlockedWeapons = useMemo(() => {
    const weapons = new Set<WeaponType>([WeaponType.NORMAL])
    selectedCards.forEach((choice) => {
      if (choice.card.perks.some((perk) => perk.type === PerkType.UNLOCK_RING)) {
        weapons.add(WeaponType.RING)
      }
    })
    return weapons
  }, [selectedCards])

  const getWeaponOptions = (card: Card): WeaponType[] => {
    if (!card.requiresWeaponSelection) return []
    const allowedTypes = card.applicableWeaponTypes ?? []
    return allowedTypes.filter((type) => unlockedWeapons.has(type))
  }

  const addCardSelection = (card: Card, assignedWeaponType?: WeaponType) => {
    setSelectedCards((prev) => [...prev, { card, assignedWeaponType }])
    setCurrentOptions([])
  }

  // Monitor game state
  useEffect(() => {
    if (!hasStarted) return

    const interval = setInterval(() => {
      if (gameStateRef.current) {
        setGameStatus(gameStateRef.current.status)
        setCurrentScore(gameStateRef.current.score)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [hasStarted, gameStateRef])

  useEffect(() => {
    if (remainingSelections > 0) {
      if (!isSelectionActive) {
        setIsSelectionActive(true)
        setCurrentOptions([])
        const status = gameStateRef.current?.status
        if (status === 'playing') {
          pauseGame()
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
    const hasRingUnlocked = selectedCards.some((choice) =>
      choice.card.perks.some((perk) => perk.type === PerkType.UNLOCK_RING)
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

    if (remainingSelections <= 0) {
      setCurrentOptions([])
      return
    }

    if (currentOptions.length === 0) {
      const optionCount = Math.min(3, remainingSelections)
      setCurrentOptions(Array.from({ length: optionCount }, () => createRandomCard()))
    }
  }, [isSelectionActive, weaponSelectionPrompt, remainingSelections, currentOptions.length])

  const handleCardSelect = (card: Card) => {
    if (!isSelectionActive || weaponSelectionPrompt) return
    if (selectedCards.some((choice) => choice.card.id === card.id)) return
    if (remainingSelections <= 0) return

    if (card.requiresWeaponSelection) {
      const options = getWeaponOptions(card)
      if (options.length === 0) return
      if (options.length === 1) {
        addCardSelection(card, options[0])
      } else {
        setWeaponSelectionPrompt({ card, options })
      }
      return
    }

    addCardSelection(card)
  }

  const handleWeaponSelection = (weapon: WeaponType) => {
    if (!weaponSelectionPrompt) return
    addCardSelection(weaponSelectionPrompt.card, weapon)
    setWeaponSelectionPrompt(null)
  }

  const handleRestart = () => {
    setHasStarted(false)
    setSelectedCards([])
    setCurrentOptions([])
    setGameStatus('card_selection' as GameStatus)
    setWeaponSelectionPrompt(null)
    wasPlayingBeforeSelectionRef.current = false
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderSelectionOverlay = isSelectionActive ? (
    <div className="absolute inset-0 bg-surface-100/95 backdrop-blur-md z-20 flex items-center justify-center p-6">
      <Button
        onClick={onExit}
        type="default"
        size="tiny"
        className="absolute top-4 right-4"
        icon={<X strokeWidth={1} size={16} />}
      />
      <div className="bg-surface-100 border border-overlay rounded-lg shadow-xl w-full max-w-lg p-6 flex flex-col gap-4">
        {!weaponSelectionPrompt ? (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-medium">Select an item</h2>
              <p className="text-sm text-foreground-light">
                {remainingSelections} selection{remainingSelections !== 1 ? 's' : ''} remaining
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {currentOptions.map((card) => {
                const weaponOptions = getWeaponOptions(card)
                const isDisabled = card.requiresWeaponSelection && weaponOptions.length === 0

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleCardSelect(card)}
                    disabled={isDisabled}
                    className={`w-44 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      isDisabled
                        ? 'border-overlay opacity-40 cursor-not-allowed'
                        : 'border-overlay hover:border-brand hover:bg-brand/10'
                    }`}
                  >
                    <div className="text-sm font-medium">{card.name}</div>
                    <div className="text-xs text-foreground-light mt-1">{card.description}</div>
                    {card.requiresWeaponSelection && weaponOptions.length === 0 && (
                      <div className="text-xs text-foreground-muted mt-2">
                        Unlock a compatible weapon to use this item
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {currentOptions.length === 0 && (
              <div className="text-center text-sm text-foreground-muted">
                Generating more items...
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-medium">Choose a weapon</h3>
              <p className="text-sm text-foreground-light">
                {weaponSelectionPrompt.card.name} can be applied to multiple weapons
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {weaponSelectionPrompt.options.map((option) => (
                <Button key={option} onClick={() => handleWeaponSelection(option)} size="tiny">
                  {weaponTypeLabels[option]}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setWeaponSelectionPrompt(null)}
              type="text"
              size="tiny"
              className="self-center"
            >
              Back to items
            </Button>
          </>
        )}
      </div>
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

      {/* HUD - Fixed position floating */}
      <div className="fixed top-4 left-4 z-10 flex flex-col gap-2">
        {/* HP */}
        <div className="flex items-center gap-2 font-mono text-sm bg-surface-100/90 backdrop-blur-sm rounded px-3 py-2 border border-overlay shadow-lg">
          <Heart strokeWidth={1.5} size={14} className="text-red-500" />
          <span>
            {Math.max(0, Math.floor(gameStateRef.current?.player.stats.currentHp || 0))} /{' '}
            {gameStateRef.current?.player.stats.maxHp || 100}
          </span>
        </div>

        {/* Score/Timer */}
        <div className="flex items-center gap-2 font-mono text-sm bg-surface-100/90 backdrop-blur-sm rounded px-3 py-2 border border-overlay shadow-lg">
          <Zap strokeWidth={1.5} size={14} className="text-yellow-500" />
          <span>{formatTime(currentScore)}</span>
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
