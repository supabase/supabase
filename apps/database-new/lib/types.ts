export type GeneratedTable = Partial<PostgresTable>

export type AssistantMessage = {
  id: string
  role: 'assistant'
  created_at: number
  sql: string
  json: GeneratedTable[]
}

export type UserMessage = {
  id: string
  role: 'user'
  created_at: number
  text: string
}
export type Message = AssistantMessage | UserMessage

export type ReadThreadAPIResult = {
  id: string
  status: 'loading' | 'completed'
  messages: Message[]
}

export type PostgresColumn = {
  id: string
  name: string
  format: string
  is_nullable: boolean
  is_unique: boolean
  is_identity: boolean
}
export type PostgresTable = {
  id: string
  name: string
  primary_keys: { name: string }[]
  relationships: {
    id: string
    target_table_name: string
    target_column_name: string
    source_table_name: string
    source_column_name: string
  }[]
  columns: PostgresColumn[]
}
