// Reference: advisor-game-example/src/App.js
import { useEffect, useMemo, useRef } from 'react'
import { Physics } from '@react-three/cannon'
import { Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { nanoid } from 'nanoid'
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import { Ground } from './Ground'
import { Cubes } from './Cubes'
import { Camera } from './Camera'
import { ResourceCounter } from './ResourceCounter'
import { useAdvisorGameStore } from '../hooks/useAdvisorGameStore'
import { useParams } from 'common'

interface AdvisorGameProps {
  availableResources: number
}

export const AdvisorGame = ({ availableResources }: AdvisorGameProps) => {
  const setResources = useAdvisorGameStore((state) => state.setResources)
  const setCubes = useAdvisorGameStore((state) => state.setCubes)
  const setAllCubes = useAdvisorGameStore((state) => state.setAllCubes)
  const getCubes = useAdvisorGameStore((state) => state.getCubes)
  const setCurrentUserId = useAdvisorGameStore((state) => state.setCurrentUserId)
  const setCurrentProjectRef = useAdvisorGameStore((state) => state.setCurrentProjectRef)
  const setActionHandlers = useAdvisorGameStore((state) => state.setActionHandlers)
  const { ref: projectRef } = useParams()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const gameInitialisedRef = useRef(false)
  const playerInitialisedRef = useRef(false)

  const supabaseConfig = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_ADVISOR_GAME_URL
    const key = process.env.NEXT_PUBLIC_ADVISOR_GAME_KEY
    if (!url || !key) {
      console.warn(
        'Supabase environment variables are not set. Advisor game multiplayer features are disabled.'
      )
      return null
    }
    return { url, key }
  }, [])

  useEffect(() => {
    setResources(availableResources)
  }, [availableResources, setResources])

  useEffect(() => {
    if (!projectRef || !supabaseConfig) {
      return
    }

    const supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
    supabaseRef.current = supabase
    let isMounted = true

    type AdvisorBlockPayload = {
      cube_key?: string
      id?: string
      position?: [number, number, number]
      pos_x?: number
      pos_y?: number
      pos_z?: number
      texture?: string | null
      created_by?: string | null
    }

    const mapBlocksToStore = (blocks: AdvisorBlockPayload[], projectRef?: string) =>
      blocks.map((block) => {
        const cubeKey =
          block.cube_key ??
          block.id ??
          (Array.isArray(block.position) ? block.position.join('-') : nanoid())
        const positionArray = Array.isArray(block.position)
          ? block.position
          : [block.pos_x, block.pos_y, block.pos_z]
        const [x, y, z] = positionArray ?? [0, 0, 0]
        return {
          cubeKey,
          pos: [Number(x), Number(y), Number(z)] as [number, number, number],
          texture: block.texture ?? 'wood',
          createdBy: block.created_by ?? null,
          projectRef: projectRef,
        }
      })

    const ensureGameInitialized = async () => {
      if (gameInitialisedRef.current) {
        return true
      }

      const { data: existingGame, error: fetchError } = await supabase
        .from('advisor_games')
        .select('resources')
        .eq('project_ref', projectRef)
        .maybeSingle()

      if (fetchError) {
        console.error('Failed to fetch advisor game', fetchError)
        return false
      }

      if (existingGame) {
        if (isMounted && existingGame.resources !== undefined && existingGame.resources !== null) {
          setResources(existingGame.resources)
        }
        gameInitialisedRef.current = true
        return true
      }

      const defaultResources =
        typeof availableResources === 'number' && Number.isFinite(availableResources)
          ? availableResources
          : 10

      const { error: insertError } = await supabase
        .from('advisor_games')
        .insert({ project_ref: projectRef, resources: defaultResources })

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: gameAfterConflict, error: refetchError } = await supabase
            .from('advisor_games')
            .select('resources')
            .eq('project_ref', projectRef)
            .maybeSingle()

          if (refetchError) {
            console.error('Failed to fetch advisor game after conflict', refetchError)
            return false
          }

          if (
            isMounted &&
            gameAfterConflict?.resources !== undefined &&
            gameAfterConflict.resources !== null
          ) {
            setResources(gameAfterConflict.resources)
          }
          gameInitialisedRef.current = true
          return true
        }

        console.error('Failed to create advisor game', insertError)
        return false
      }

      if (isMounted) {
        setResources(defaultResources)
      }
      gameInitialisedRef.current = true
      return true
    }

    const ensurePlayerInitialized = async (userId: string | null) => {
      if (!userId) {
        playerInitialisedRef.current = false
        return true
      }

      if (playerInitialisedRef.current) {
        return true
      }

      const { error: upsertError } = await supabase
        .from('advisor_players')
        .upsert(
          { project_ref: projectRef, user_id: userId },
          { onConflict: 'project_ref,user_id', ignoreDuplicates: false }
        )

      if (upsertError) {
        console.error('Failed to upsert advisor player', upsertError)
        return false
      }

      playerInitialisedRef.current = true
      return true
    }

    const setupActionHandlers = (userId: string | null) => {
      const adjustResourcesOnServer = async (delta: number) => {
        if (delta === 0) return
        const adjustLocal = useAdvisorGameStore.getState().adjustResources
        adjustLocal(delta)

        const desiredResources = useAdvisorGameStore.getState().getRemainingResources()
        const { data: updatedGame, error: resourcesError } = await supabase
          .from('advisor_games')
          .update({ resources: desiredResources })
          .eq('project_ref', projectRef)
          .select('resources')
          .maybeSingle()

        if (resourcesError) {
          console.error('Failed to update advisor resources', resourcesError)
          adjustLocal(-delta)
          return
        }

        if (!updatedGame || updatedGame.resources === undefined || updatedGame.resources === null) {
          console.warn('Advisor game resources update returned no data')
          adjustLocal(-delta)
          return
        }

        setResources(updatedGame.resources)
      }

      setActionHandlers({
        placeCube: async (position) => {
          const [x, y, z] = position
          const state = useAdvisorGameStore.getState()

          if (state.getRemainingResources() <= 0) {
            return
          }

          const existingCubes = state.getCubes(projectRef)
          const alreadyExists = existingCubes.some(
            (cube) => cube.pos[0] === x && cube.pos[1] === y && cube.pos[2] === z
          )
          if (alreadyExists) {
            return
          }

          const supa = supabaseRef.current
          if (!supa) return

          const gameReady = await ensureGameInitialized()
          if (!gameReady) {
            return
          }

          const playerReady = await ensurePlayerInitialized(userId ?? null)
          if (userId && !playerReady) {
            return
          }

          const payload: {
            project_ref: string
            cube_key: string
            pos_x: number
            pos_y: number
            pos_z: number
            texture: string
            created_by?: string
          } = {
            project_ref: projectRef,
            cube_key: nanoid(),
            pos_x: x,
            pos_y: y,
            pos_z: z,
            texture: 'wood',
          }

          if (userId) {
            payload.created_by = userId
          }

          const { error } = await supa.from('advisor_blocks').insert(payload)

          if (error) {
            console.error('Failed to place cube', error)
            return
          }

          const latestState = useAdvisorGameStore.getState()
          const newCube = {
            cubeKey: payload.cube_key,
            pos: [payload.pos_x, payload.pos_y, payload.pos_z] as [number, number, number],
            texture: payload.texture,
            createdBy: payload.created_by ?? null,
            projectRef: projectRef,
          }
          const latestCubes = latestState.getCubes(projectRef)
          const updatedCubes = [...latestCubes, newCube]
          setCubes(updatedCubes, projectRef)

          // Update all cubes to include the new cube
          const allCubes = useAdvisorGameStore.getState().allCubes
          const updatedAllCubes = [...allCubes, newCube]
          setAllCubes(updatedAllCubes)

          await adjustResourcesOnServer(-1)
        },
        removeCube: async (position) => {
          const [x, y, z] = position
          const state = useAdvisorGameStore.getState()

          const targetCubes = state.getCubes(projectRef)
          const target = targetCubes.find(
            (cube) => cube.pos[0] === x && cube.pos[1] === y && cube.pos[2] === z
          )

          if (!target) {
            return
          }

          if (target.createdBy && userId && target.createdBy !== userId) {
            return
          }

          const supa = supabaseRef.current
          if (!supa) return

          const { error } = await supa
            .from('advisor_blocks')
            .delete()
            .eq('project_ref', projectRef)
            .eq('cube_key', target.cubeKey)

          if (error) {
            console.error('Failed to remove cube', error)
            return
          }

          const latestState = useAdvisorGameStore.getState()
          const remainingCubes = latestState.getCubes(projectRef)
          const updatedCubes = remainingCubes.filter((cube) => cube.cubeKey !== target.cubeKey)
          setCubes(updatedCubes, projectRef)

          // Update all cubes to remove the deleted cube
          const allCubes = useAdvisorGameStore.getState().allCubes
          const updatedAllCubes = allCubes.filter((cube) => cube.cubeKey !== target.cubeKey)
          setAllCubes(updatedAllCubes)

          await adjustResourcesOnServer(1)
        },
      })
    }

    const initialise = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Failed to get Supabase session', sessionError)
      }

      let userId = session?.user?.id ?? null

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Failed to sign in anonymously', error)
          return
        }
        userId = data.user?.id ?? null
      }

      if (!isMounted) return
      setCurrentUserId(userId)
      setCurrentProjectRef(projectRef)
      playerInitialisedRef.current = false

      const gameReady = await ensureGameInitialized()

      if (!isMounted || !gameReady) return

      const playerReady = await ensurePlayerInitialized(userId)

      if (!isMounted) return

      if (userId && !playerReady) {
        console.warn('Advisor player initialisation failed - multiplayer actions may be limited')
      }

      setupActionHandlers(userId)

      const { data: blockRows, error: blocksError } = await supabase
        .from('advisor_blocks')
        .select('cube_key, pos_x, pos_y, pos_z, texture, created_by, project_ref')

      if (!isMounted) return

      if (blocksError) {
        console.error('Failed to fetch advisor blocks', blocksError)
      } else if (blockRows) {
        // Load all blocks into allCubes
        const allBlocks = blockRows.map((block) => {
          const cubeKey = block.cube_key ?? nanoid()
          const [x, y, z] = [block.pos_x ?? 0, block.pos_y ?? 0, block.pos_z ?? 0]
          return {
            cubeKey,
            pos: [Number(x), Number(y), Number(z)] as [number, number, number],
            texture: block.texture ?? 'wood',
            createdBy: block.created_by ?? null,
            projectRef: block.project_ref,
          }
        })
        setAllCubes(allBlocks)

        // Group blocks by project for project-specific operations
        const blocksByProject = allBlocks.reduce(
          (acc, block) => {
            const projectRef = block.projectRef || 'unknown'
            if (!acc[projectRef]) {
              acc[projectRef] = []
            }
            acc[projectRef].push(block)
            return acc
          },
          {} as Record<string, typeof allBlocks>
        )

        // Set cubes for each project
        Object.entries(blocksByProject).forEach(([projectRef, blocks]) => {
          setCubes(blocks, projectRef)
        })
      }

      const channel = supabase
        .channel(`advisor_game`)
        .on('broadcast', { event: 'state_update' }, (event) => {
          console.log('state_update', event.payload)
          const payload = event.payload as {
            project_ref?: string
            resources?: number
            remaining_resources?: number
            blocks?: any[]
          }

          // Only update resources for the current project
          if (payload.project_ref === projectRef) {
            const nextResources = payload.resources ?? payload.remaining_resources ?? null

            if (nextResources !== null && nextResources !== undefined) {
              setResources(nextResources)
            }
          }

          // Always update blocks for all projects
          if (Array.isArray(payload.blocks)) {
            const updatedBlocks = payload.blocks.map((block) => {
              const cubeKey = block.cube_key ?? block.id ?? nanoid()
              const positionArray = Array.isArray(block.position)
                ? block.position
                : [block.pos_x, block.pos_y, block.pos_z]
              const [x, y, z] = positionArray ?? [0, 0, 0]
              return {
                cubeKey,
                pos: [Number(x), Number(y), Number(z)] as [number, number, number],
                texture: block.texture ?? 'wood',
                createdBy: block.created_by ?? null,
                projectRef: payload.project_ref,
              }
            })

            // Update only the blocks for the specific project that sent the update
            const currentAllCubes = useAdvisorGameStore.getState().allCubes
            const otherProjectBlocks = currentAllCubes.filter(
              (cube) => cube.projectRef !== payload.project_ref
            )
            const updatedAllCubes = [...otherProjectBlocks, ...updatedBlocks]
            setAllCubes(updatedAllCubes)

            // Update project-specific cubes for the updated project
            setCubes(updatedBlocks, payload.project_ref || 'unknown')
          }
        })
        .subscribe()

      channelRef.current = channel
    }

    void initialise()

    return () => {
      isMounted = false
      setActionHandlers(null)
      setCurrentUserId(null)
      setCurrentProjectRef(null)
      const channel = channelRef.current
      if (channel && supabaseRef.current) {
        supabaseRef.current.removeChannel(channel)
      }
      channelRef.current = null
      supabaseRef.current = null
      gameInitialisedRef.current = false
      playerInitialisedRef.current = false
    }
  }, [
    availableResources,
    projectRef,
    setActionHandlers,
    setCurrentUserId,
    setCurrentProjectRef,
    setCubes,
    setAllCubes,
    setResources,
    supabaseConfig,
  ])

  return (
    <div className="relative w-full h-full">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 60 }}>
        <color attach="background" args={['#2a2a2a']} />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#00d9ff" />
        <Camera />
        <Physics gravity={[0, 0, 0]}>
          <Ground />
          {projectRef && <Cubes projectRef={projectRef} />}
        </Physics>
      </Canvas>
      <ResourceCounter />
    </div>
  )
}
