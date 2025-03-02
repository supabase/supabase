export interface Coordinates {
  x: number | undefined
  y: number | undefined
}

export interface Message {
  id: number
  user_id: string
  message: string
}

export interface Payload<T> {
  type: string
  event: string
  payload?: T
}

export interface User extends Coordinates {
  color: string
  hue: string
  isTyping?: boolean
  message?: string
}
