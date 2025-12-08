'use client'

<<<<<<< HEAD
<<<<<<< HEAD
import { motion, useInView } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
=======
import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo } from 'react'
>>>>>>> c9e9354b96 (single page)
=======
import { motion, useInView } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
>>>>>>> f735fc1b6b (optimize imgs)
import { Dots, Stripes } from './Visuals'

const STAGGER_DELAY = 0.05
const MOVE_INTERVAL = 2000 // Time between moves in ms
<<<<<<< HEAD
<<<<<<< HEAD
=======
const MOVE_DURATION = 0.5 // Animation duration in seconds
>>>>>>> c9e9354b96 (single page)
=======
>>>>>>> f735fc1b6b (optimize imgs)

type TileType = 'dots' | 'stripes'

type TileConfig = {
  id: number
  type: TileType
  initialCell: number
}

<<<<<<< HEAD
type ResponsiveRows = {
  mobile: number
  desktop: number
}

type AnimatedGridBackgroundProps = {
  cols: number
  rows: number | ResponsiveRows
=======
type AnimatedGridBackgroundProps = {
  cols: number
  rows: number
>>>>>>> c9e9354b96 (single page)
  tiles: Array<{ cell: number; type: TileType }>
  initialDelay?: number
}

export function AnimatedGridBackground({
  cols,
  rows,
  tiles,
  initialDelay = 0,
}: AnimatedGridBackgroundProps) {
<<<<<<< HEAD
  // Detect if we're on mobile (client-side only)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get the actual row count based on responsive config
  const actualRows = typeof rows === 'number' ? rows : isMobile ? rows.mobile : rows.desktop
  const totalCells = cols * actualRows

  // Convert tiles config to internal format with IDs, filtering out tiles outside bounds
  const tileConfigs: TileConfig[] = useMemo(
    () =>
      tiles
        .filter((tile) => tile.cell < totalCells)
        .map((tile, index) => ({
          id: index,
          type: tile.type,
          initialCell: tile.cell,
        })),
    [tiles, totalCells]
  )

  // Track current positions of all tiles
  const [tilePositions, setTilePositions] = useState<Map<number, number>>(new Map())

  // Reinitialize tile positions when tileConfigs changes (e.g., on responsive change)
  useEffect(() => {
=======
  const totalCells = cols * rows

  // Convert tiles config to internal format with IDs
  const tileConfigs: TileConfig[] = useMemo(
    () =>
      tiles.map((tile, index) => ({
        id: index,
        type: tile.type,
        initialCell: tile.cell,
      })),
    [tiles]
  )

  // Track current positions of all tiles
  const [tilePositions, setTilePositions] = useState<Map<number, number>>(() => {
>>>>>>> c9e9354b96 (single page)
    const initial = new Map<number, number>()
    tileConfigs.forEach((tile) => {
      initial.set(tile.id, tile.initialCell)
    })
<<<<<<< HEAD
    setTilePositions(initial)
  }, [tileConfigs])
=======
    return initial
  })
>>>>>>> c9e9354b96 (single page)

  // Get adjacent cells (up, down, left, right) that are within bounds
  const getAdjacentCells = useCallback(
    (cell: number): number[] => {
      const row = Math.floor(cell / cols)
      const col = cell % cols
      const adjacent: number[] = []

      // Up
      if (row > 0) adjacent.push(cell - cols)
      // Down
<<<<<<< HEAD
      if (row < actualRows - 1) adjacent.push(cell + cols)
=======
      if (row < rows - 1) adjacent.push(cell + cols)
>>>>>>> c9e9354b96 (single page)
      // Left
      if (col > 0) adjacent.push(cell - 1)
      // Right
      if (col < cols - 1) adjacent.push(cell + 1)

      return adjacent
    },
<<<<<<< HEAD
    [cols, actualRows]
=======
    [cols, rows]
>>>>>>> c9e9354b96 (single page)
  )

  // Get occupied cells
  const getOccupiedCells = useCallback((): Set<number> => {
    return new Set(tilePositions.values())
  }, [tilePositions])

  // Move a random tile to an adjacent empty cell
  const moveRandomTile = useCallback(() => {
    const occupiedCells = getOccupiedCells()
    const tileIds = Array.from(tilePositions.keys())

    // Shuffle tile IDs to pick randomly
    const shuffledIds = [...tileIds].sort(() => Math.random() - 0.5)

    for (const tileId of shuffledIds) {
      const currentCell = tilePositions.get(tileId)!
      const adjacentCells = getAdjacentCells(currentCell)

      // Find empty adjacent cells
      const emptyAdjacent = adjacentCells.filter((cell) => !occupiedCells.has(cell))

      if (emptyAdjacent.length > 0) {
        // Pick a random empty adjacent cell
        const targetCell = emptyAdjacent[Math.floor(Math.random() * emptyAdjacent.length)]

        setTilePositions((prev) => {
          const next = new Map(prev)
          next.set(tileId, targetCell)
          return next
        })

        return // Only move one tile per interval
      }
    }
  }, [tilePositions, getAdjacentCells, getOccupiedCells])

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f735fc1b6b (optimize imgs)
  // Ref for viewport detection
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  // Set up the movement interval (only when in view)
<<<<<<< HEAD
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(moveRandomTile, MOVE_INTERVAL)
    return () => clearInterval(interval)
  }, [moveRandomTile, isInView])
=======
  // Set up the movement interval
=======
>>>>>>> f735fc1b6b (optimize imgs)
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(moveRandomTile, MOVE_INTERVAL)
    return () => clearInterval(interval)
<<<<<<< HEAD
  }, [moveRandomTile])
>>>>>>> c9e9354b96 (single page)
=======
  }, [moveRandomTile, isInView])
>>>>>>> f735fc1b6b (optimize imgs)

  // Calculate position offset for animation
  const getCellPosition = (cell: number) => {
    const row = Math.floor(cell / cols)
    const col = cell % cols
    return { row, col }
  }

  // Calculate the CSS transform for a tile based on its current cell vs initial cell
  const getTileTransform = (tileId: number, initialCell: number) => {
    const currentCell = tilePositions.get(tileId) ?? initialCell
    const initial = getCellPosition(initialCell)
    const current = getCellPosition(currentCell)

<<<<<<< HEAD
<<<<<<< HEAD
    const colDiff = current.col - initial.col
    const rowDiff = current.row - initial.row

    // Account for 1px border between cells
    const xOffset = colDiff * 100
    const yOffset = rowDiff * 100
    const xBorderOffset = colDiff
    const yBorderOffset = rowDiff

    return {
      x: `calc(${xOffset}% + ${xBorderOffset}px)`,
      y: `calc(${yOffset}% + ${yBorderOffset}px)`,
    }
=======
    const xOffset = (current.col - initial.col) * 100
    const yOffset = (current.row - initial.row) * 100

    return { x: `${xOffset}%`, y: `${yOffset}%` }
>>>>>>> c9e9354b96 (single page)
=======
    const colDiff = current.col - initial.col
    const rowDiff = current.row - initial.row

    // Account for 1px border between cells
    const xOffset = colDiff * 100
    const yOffset = rowDiff * 100
    const xBorderOffset = colDiff
    const yBorderOffset = rowDiff

    return {
      x: `calc(${xOffset}% + ${xBorderOffset}px)`,
      y: `calc(${yOffset}% + ${yBorderOffset}px)`,
    }
>>>>>>> f735fc1b6b (optimize imgs)
  }

  return (
    <div
<<<<<<< HEAD
<<<<<<< HEAD
      ref={containerRef}
      className={`absolute inset-0 grid h-full [&>*]:border-muted [&>*]:border-r [&>*]:border-b overflow-hidden`}
=======
      ref={containerRef}
      className={`absolute inset-0 grid h-full [&>*]:border-muted [&>*]:border-r [&>*]:border-b`}
>>>>>>> f735fc1b6b (optimize imgs)
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${actualRows}, 1fr)`,
=======
      className={`absolute inset-0 grid h-full [&>*]:border-muted [&>*]:border-r [&>*]:border-b`}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
>>>>>>> c9e9354b96 (single page)
      }}
    >
      {Array.from({ length: totalCells }).map((_, cellIndex) => {
        const row = Math.floor(cellIndex / cols)
        const col = cellIndex % cols
        const diagonalIndex = row + col

        // Check if this cell is the initial position of any tile
        const tile = tileConfigs.find((t) => t.initialCell === cellIndex)

        // Remove right border on last column
        const isLastCol = col === cols - 1
        // Remove bottom border on last row
        const isLastRow = row === rows - 1

        return (
          <div
            key={cellIndex}
            className={`relative ${isLastCol ? '!border-r-0' : ''} ${isLastRow ? '!border-b-0' : ''}`}
          >
            {tile && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.98 }}
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f735fc1b6b (optimize imgs)
                animate={
                  isInView
                    ? {
                        opacity: 1,
                        scale: 1,
                        x: getTileTransform(tile.id, tile.initialCell).x,
                        y: getTileTransform(tile.id, tile.initialCell).y,
                      }
                    : { opacity: 0, scale: 0.98 }
                }
<<<<<<< HEAD
=======
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: getTileTransform(tile.id, tile.initialCell).x,
                  y: getTileTransform(tile.id, tile.initialCell).y,
                }}
>>>>>>> c9e9354b96 (single page)
=======
>>>>>>> f735fc1b6b (optimize imgs)
                transition={{
                  opacity: {
                    delay: initialDelay + diagonalIndex * STAGGER_DELAY,
                    duration: 0.3,
                  },
                  scale: {
                    delay: initialDelay + diagonalIndex * STAGGER_DELAY,
                    duration: 0.3,
                  },
<<<<<<< HEAD
<<<<<<< HEAD
                  x: { type: 'spring', duration: 0.69, bounce: 0.12 },
                  y: { type: 'spring', duration: 0.69, bounce: 0.12 },
=======
                  x: { type: 'spring', stiffness: 200, damping: 20 },
                  y: { type: 'spring', stiffness: 200, damping: 20 },
>>>>>>> c9e9354b96 (single page)
=======
                  x: { type: 'spring', duration: 0.69, bounce: 0.12 },
                  y: { type: 'spring', duration: 0.69, bounce: 0.12 },
>>>>>>> f735fc1b6b (optimize imgs)
                }}
              >
                {tile.type === 'dots' ? <Dots /> : <Stripes />}
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
