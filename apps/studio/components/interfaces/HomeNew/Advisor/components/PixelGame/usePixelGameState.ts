import { useEffect, useState, useCallback } from 'react'
import { advisorGameClient } from './supabase'
import type { GameState, Block } from './types'
import { groupBy } from 'lodash'

export const usePixelGameState = (projectRef: string) => {
  const [gameState, setGameState] = useState<Record<string, GameState> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all blocks across all projects
  const fetchAllBlocks = useCallback(async (): Promise<Block[]> => {
    try {
      const { data: blocks, error: blocksError } = await advisorGameClient
        .from('advisor_blocks')
        .select('*')
        .order('created_at', { ascending: true })

      if (blocksError) throw blocksError

      // Transform database blocks to match Block type with position array
      return (blocks || []).map((block: any) => ({
        project_ref: block.project_ref,
        id: block.id,
        position: [block.pos_x, block.pos_y, block.pos_z] as [number, number, number],
        texture: block.texture,
        created_by: block.created_by,
        created_at: block.created_at,
      }))
    } catch (err) {
      console.error('Failed to fetch all blocks:', err)
      return []
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if already signed in
        const {
          data: { session: existingSession },
        } = await advisorGameClient.auth.getSession()

        let session = existingSession

        // Sign in anonymously if not already authenticated
        if (!session) {
          const { data, error: authError } = await advisorGameClient.auth.signInAnonymously()

          if (authError) {
            console.error('Failed to sign in anonymously:', authError)
            setError('Failed to authenticate')
            setIsLoading(false)
            return
          }

          session = data.session
        }

        if (session) {
          // Set auth for realtime
          if (session.access_token) {
            await advisorGameClient.realtime.setAuth(session.access_token)
          }
          setIsAuthenticated(true)
        } else {
          console.error('No session after authentication')
          setError('Failed to get session')
          setIsLoading(false)
          return
        }

        // Fetch all blocks initially (across all projects)
        const allBlocks = await fetchAllBlocks()
        const groupedBlocks = groupBy(allBlocks, 'project_ref')

        // Fetch current project game state
        const { data: game, error: gameError } = await advisorGameClient
          .from('advisor_games')
          .select('*')
          .eq('project_ref', projectRef)
          .single()

        if (gameError && gameError.code !== 'PGRST116') {
          // Ignore "not found" error
          console.error('Failed to fetch game state:', gameError)
        }

        const condensedGameState = Object.fromEntries(
          Object.entries(groupedBlocks).map(([projectRef, blocks]) => [
            projectRef,
            {
              project_ref: projectRef,
              resources: game?.resources || 0,
              blocks: blocks,
              players: [],
              updated_at: game?.updated_at || new Date().toISOString(),
            },
          ])
        )

        setGameState(condensedGameState)

        setIsLoading(false)

        const channel = advisorGameClient.channel('advisor_game')

        channel
          .on('broadcast', { event: 'state_update' }, async (payload) => {
            const state = payload.payload as GameState

            setGameState((prev: Record<string, GameState> | null) => {
              const updated = { ...prev }

              // Update the specific project's metadata with broadcast data
              updated[state.project_ref] = {
                ...state,
                blocks: state.blocks, // Use all blocks globally
              }

              return updated
            })
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsLoading(false)
            }
          })

        return channel
      } catch (err) {
        console.error('Failed to initialize auth:', err)
        setError('Failed to initialize game')
        setIsLoading(false)
      }
    }

    const channelPromise = initAuth()

    return () => {
      channelPromise.then((channel) => channel?.unsubscribe())
    }
  }, [projectRef, fetchAllBlocks])

  const hasAdjacentBlock = useCallback(
    (x: number, y: number, z: number, blocks: Block[]): boolean => {
      if (z === 0) return true // Ground level always allowed

      // Check for block directly below
      const hasBlockBelow = blocks.some(
        (block) => block.position[0] === x && block.position[1] === y && block.position[2] === z - 1
      )

      if (hasBlockBelow) return true

      // If z > 0, check for adjacent blocks at same level that belong to this project
      if (z > 0) {
        const adjacentPositions = [
          [x + 1, y, z],
          [x - 1, y, z],
          [x, y + 1, z],
          [x, y - 1, z],
        ]

        return adjacentPositions.some(([adjX, adjY, adjZ]) =>
          blocks.some(
            (block) =>
              block.position[0] === adjX && block.position[1] === adjY && block.position[2] === adjZ
          )
        )
      }

      return false
    },
    []
  )

  const canPlaceBlock = useCallback(
    (x: number, y: number, z: number): boolean => {
      if (!gameState || !gameState[projectRef]) return false

      const currentProjectState = gameState[projectRef]

      // Check if we have resources
      if (currentProjectState.used_resources >= currentProjectState.resources) return false

      // Check if position is already occupied (across all projects)
      const allBlocks = currentProjectState.blocks
      const isOccupied = allBlocks.some(
        (block) => block.position[0] === x && block.position[1] === y && block.position[2] === z
      )
      if (isOccupied) return false

      // First block can be placed anywhere at z=0
      if (allBlocks.length === 0 && z === 0) return true

      // Check adjacency rules against all blocks
      return hasAdjacentBlock(x, y, z, allBlocks)
    },
    [gameState, projectRef, hasAdjacentBlock]
  )

  return {
    gameState,
    isLoading,
    isAuthenticated,
    error,
    canPlaceBlock,
  }
}
