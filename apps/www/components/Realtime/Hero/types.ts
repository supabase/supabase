export type CursorPayload = {
  position: { x: number; y: number }
  user: { id: string; name: string }
  color: string
  timestamp: number
}

export type CellFocusPayload = {
  rowId: string
  columnKey: string
  userId: string
  name: string
  color: string
  isFocused: boolean
}
