export type TableState = {
  table_id: number
  table_name: string
  state:
    | { name: 'queued' }
    | { name: 'copying_table' }
    | { name: 'copied_table' }
    | { name: 'following_wal'; lag: number }
    | { name: 'error'; message: string }
}
