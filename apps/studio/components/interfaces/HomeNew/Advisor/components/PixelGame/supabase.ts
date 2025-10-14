import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_ADVISOR_GAME_URL!
const supabaseKey = process.env.NEXT_PUBLIC_ADVISOR_GAME_KEY!

export const advisorGameClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export interface PlaceBlockParams {
  project_ref: string
  pos_x: number
  pos_y: number
  pos_z: number
  texture?: string
}

export const placeBlock = async ({
  project_ref,
  pos_x,
  pos_y,
  pos_z,
  texture = 'wood',
}: PlaceBlockParams) => {
  const { data, error } = await advisorGameClient
    .from('advisor_blocks')
    .insert({
      project_ref,
      pos_x,
      pos_y,
      pos_z,
      texture,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getGameState = async (project_ref: string) => {
  const { data: game, error: gameError } = await advisorGameClient
    .from('advisor_games')
    .select('*')
    .eq('project_ref', project_ref)
    .single()

  if (gameError) throw gameError

  const { data: blocks, error: blocksError } = await advisorGameClient
    .from('advisor_blocks')
    .select('*')
    .eq('project_ref', project_ref)
    .order('created_at', { ascending: true })

  if (blocksError) throw blocksError

  return {
    game,
    blocks: blocks || [],
  }
}

export const initializeGame = async (project_ref: string, resources: number) => {
  const {
    data: { session },
  } = await advisorGameClient.auth.getSession()
  console.log('Current session in fetch:', session?.user?.id)
  const { data, error } = await advisorGameClient
    .from('advisor_games')
    .upsert(
      {
        project_ref,
        resources,
        metadata: {},
      },
      {
        onConflict: 'project_ref',
      }
    )
    .select()
    .single()

  console.log('Game initialized:', data, error)

  if (error) throw error
  return data
}

export const removeBlock = async (project_ref: string, id: string) => {
  const { error } = await advisorGameClient
    .from('advisor_blocks')
    .delete()
    .eq('project_ref', project_ref)
    .eq('id', id)

  if (error) throw error
}

export const updatePlayerPresence = async (
  project_ref: string,
  user_id: string,
  display_name: string | null
) => {
  const { data, error } = await advisorGameClient
    .from('advisor_players')
    .upsert(
      {
        project_ref,
        user_id,
        display_name,
        presence: {},
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: 'project_ref,user_id',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}
