import { useEffect, useRef, useState } from 'react'
import { useParams } from 'common'
import { PixelCanvas } from './PixelCanvas'
import { usePixelGameState } from './usePixelGameState'
import {
  placeBlock,
  initializeGame,
  advisorGameClient,
  updatePlayerPresence,
  removeBlock,
} from './supabase'
import { Button, LogoLoader } from 'ui'
import { Cuboid, X } from 'lucide-react'
import { useRealtimeCursors } from './use-realtime-cursors'

interface PixelGameProps {
  availableResources: number
  onExit: () => void
}

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
]

export const PixelGame = ({ availableResources, onExit }: PixelGameProps) => {
  const { ref: projectRef } = useParams()
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const { gameState, isLoading, isAuthenticated, canPlaceBlock } = usePixelGameState(projectRef!)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onMouseMoveRef = useRef<((canvasX: number, canvasY: number) => void) | undefined>()

  const handleCanvasMouseMove = (canvasX: number, canvasY: number) => {
    if (onMouseMoveRef.current) {
      onMouseMoveRef.current(canvasX, canvasY)
    }
  }

  // Initialize cursors hook - safe to call even when canvas isn't ready yet
  const { cursors } = useRealtimeCursors({
    roomName: 'advisor_game',
    username: 'Supabase User',
    throttleMs: 50,
    canvasRef,
    onMouseMoveRef,
  })

  useEffect(() => {
    const initialize = async () => {
      if (!projectRef || !isAuthenticated) return

      try {
        const {
          data: { session },
        } = await advisorGameClient.auth.getSession()

        // Create game first (required for foreign key constraint)
        await initializeGame(projectRef, availableResources)

        // Register player (required for policies)
        if (session?.user?.id) {
          await updatePlayerPresence(projectRef, session.user.id, null)
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize game:', err)
        setError('Failed to initialize game')
      }
    }

    initialize()
  }, [projectRef, availableResources, isAuthenticated])

  const handlePlaceBlock = async (x: number, y: number, z: number) => {
    if (!projectRef || !canPlaceBlock(x, y, z)) return

    try {
      await placeBlock({
        project_ref: projectRef,
        pos_x: x,
        pos_y: y,
        pos_z: z,
        texture: selectedColor,
      })
    } catch (err) {
      console.error('Failed to place block:', err)
      setError('Failed to place block')
    }
  }

  const handleRemoveBlock = async (x: number, y: number, z: number) => {
    if (!projectRef) return

    try {
      await removeBlock(projectRef, x, y, z)
    } catch (err) {
      console.error('Failed to remove block:', err)
      setError('Failed to remove block')
    }
  }

  if (!projectRef) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-foreground-light">Project not found</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={onExit}>Exit Game</Button>
      </div>
    )
  }

  console.log('loading:', isLoading, isInitialized, gameState)

  if (isLoading || !isInitialized || !gameState || !gameState[projectRef]) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-foreground-light">
          <LogoLoader />
        </p>
      </div>
    )
  }

  const currentProjectState = gameState[projectRef]
  const remainingResources = currentProjectState.resources - currentProjectState.used_resources

  // Get all blocks across all projects for display
  const allBlocks = Object.values(gameState).flatMap((state) => state.blocks)

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Button
        onClick={onExit}
        type="default"
        size="icon"
        className="absolute top-4 right-4 z-10"
        icon={<X strokeWidth={1} size={16} />}
      />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 font-mono text-sm text-foreground-light">
        <Cuboid strokeWidth={1} size={16} />
        {remainingResources}
      </div>

      {/* Color Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-surface-100 rounded-full px-3 py-2 shadow-lg border border-overlay flex gap-2 items-center">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setSelectedColor(color.value)}
            className={`w-4 h-4 rounded-full transition-all hover:scale-110 ${
              selectedColor === color.value
                ? 'ring-1 ring-foreground ring-offset-1 ring-offset-surface-100 scale-110'
                : ''
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>

      <PixelCanvas
        blocks={allBlocks}
        onPlaceBlock={handlePlaceBlock}
        onRemoveBlock={handleRemoveBlock}
        canPlaceBlock={canPlaceBlock}
        cursors={cursors}
        onMouseMove={handleCanvasMouseMove}
        canvasRef={canvasRef}
      />
    </div>
  )
}
