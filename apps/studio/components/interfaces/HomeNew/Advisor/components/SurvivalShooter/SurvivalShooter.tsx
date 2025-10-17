import { useState, useEffect } from 'react'
import { Button } from 'ui'
import { X, Heart, Zap } from 'lucide-react'
import { SurvivalCanvas } from './SurvivalCanvas'
import { useGameLoop } from './useGameLoop'
import type { Card, GameStatus } from './types'
import { PerkType } from './types'

interface SurvivalShooterProps {
  availableResources: number
  onExit: () => void
}

// Generate random cards based on available resources
const generateCards = (count: number): Card[] => {
  const allItemTypes = [
    {
      type: PerkType.HP_INCREASE,
      name: 'Health Potion',
      desc: '+30 HP',
      value: 30
    },
    {
      type: PerkType.ATTACK_SPEED,
      name: 'Attack Speed',
      desc: '+25% Speed (All Weapons)',
      value: 25
    },
    {
      type: PerkType.ATTACK_DAMAGE,
      name: 'Damage Boost',
      desc: '+25% Damage (All Weapons)',
      value: 25
    },
    {
      type: PerkType.PROJECTILE_COUNT,
      name: 'Multishot',
      desc: '+1 Projectile (All Weapons)',
      value: 1
    },
    {
      type: PerkType.PROJECTILE_SIZE,
      name: 'Big Shot',
      desc: '+50% Size (All Weapons)',
      value: 0.5
    },
    {
      type: PerkType.UNLOCK_RING,
      name: 'Ring Weapon',
      desc: 'Unlock Expanding Ring',
      value: 1
    },
  ]

  return Array.from({ length: count }, (_, i) => {
    const itemData = allItemTypes[Math.floor(Math.random() * allItemTypes.length)]
    const isStatBoost = itemData.type === PerkType.HP_INCREASE
    return {
      id: `card_${i}`,
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
    }
  })
}

export const SurvivalShooter = ({ availableResources, onExit }: SurvivalShooterProps) => {
  const maxCards = Math.min(Math.floor(availableResources / 5), 5)
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [availableCards, setAvailableCards] = useState<Card[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>('card_selection' as GameStatus)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const { gameStateRef, config, startGame, pauseGame, resumeGame, updateMousePosition } =
    useGameLoop(selectedCards, canvasSize)

  // Generate cards on mount
  useEffect(() => {
    if (maxCards > 0) {
      setAvailableCards(generateCards(maxCards))
    } else {
      // If no resources for cards, start immediately
      setHasStarted(true)
      startGame()
    }
  }, [maxCards])

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

  const handleCardSelect = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id))
    } else {
      setSelectedCards([...selectedCards, card])
    }
  }

  const handleStartGame = () => {
    setHasStarted(true)
    startGame()
  }

  const handleRestart = () => {
    setHasStarted(false)
    setSelectedCards([])
    setAvailableCards(generateCards(maxCards))
    setGameStatus('card_selection' as GameStatus)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Card selection screen
  if (!hasStarted && maxCards > 0) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-alternative">
        <Button
          onClick={onExit}
          type="default"
          size="tiny"
          className="absolute top-4 right-4 z-10"
          icon={<X strokeWidth={1} size={16} />}
        />

        <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium mb-2">Select Your Items</h2>
            <p className="text-sm text-foreground-light">
              Choose up to {maxCards} item{maxCards !== 1 ? 's' : ''} to enhance your abilities
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center max-w-md">
            {availableCards.map((card) => {
              const isSelected = selectedCards.find((c) => c.id === card.id)
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(card)}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? 'border-brand bg-brand/10 scale-105'
                        : 'border-overlay hover:border-foreground-muted hover:scale-105'
                    }
                  `}
                >
                  <div className="text-sm font-medium">{card.name}</div>
                  <div className="text-xs text-foreground-light mt-1">{card.description}</div>
                </button>
              )
            })}
          </div>

          <Button onClick={handleStartGame} size="small" type="primary">
            Start Game
          </Button>
        </div>
      </div>
    )
  }

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
    </div>
  )
}
