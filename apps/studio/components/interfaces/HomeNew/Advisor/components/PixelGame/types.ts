export interface Block {
  id: string
  position: [number, number, number]
  texture: string
  created_by: string
  created_at: string
}

export interface Player {
  id: string
  user_id: string
  display_name: string | null
  presence: Record<string, any>
  joined_at: string
  last_seen_at: string
}

export interface GameState {
  project_ref: string
  resources: number
  used_resources: number
  blocks: Block[]
  players: Player[]
  updated_at: string
}

export interface ViewState {
  offsetX: number
  offsetY: number
  scale: number
}
