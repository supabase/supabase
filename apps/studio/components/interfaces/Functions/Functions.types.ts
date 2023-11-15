export interface Function {
  id: string
  slug: string
  name: string
  version: 9
  status: 'ACTIVE' | 'INACTIVE' | 'THROTTLE'
  created_at: number
  updated_at: number
}

export interface Commands {
  command: string
  description: string
  jsx?: () => void
  comment?: string
}
