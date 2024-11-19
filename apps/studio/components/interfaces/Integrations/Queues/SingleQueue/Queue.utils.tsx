import { capitalize } from 'lodash'

export const QUEUE_MESSAGE_TYPES = ['archived', 'available', 'scheduled'] as const
export type QUEUE_MESSAGE_TYPE = (typeof QUEUE_MESSAGE_TYPES)[number]

export const QUEUE_MESSAGE_OPTIONS = QUEUE_MESSAGE_TYPES.map((type) => ({
  id: type,
  name: capitalize(type),
}))
