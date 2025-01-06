import { capitalize } from 'lodash'

export const QUEUE_MESSAGE_TYPES = ['archived', 'available', 'scheduled'] as const
export type QUEUE_MESSAGE_TYPE = (typeof QUEUE_MESSAGE_TYPES)[number]

export const QUEUE_MESSAGE_OPTIONS = QUEUE_MESSAGE_TYPES.map((type) => ({
  id: type,
  name: capitalize(type),
}))

export const getQueueFunctionsMapping = (command: string) => {
  switch (command) {
    case 'select':
      return ['send', 'send_batch', 'read', 'pop', 'archive', 'delete']
    case 'insert':
      return ['send', 'send_batch']
    case 'update':
      return ['read', 'pop']
    case 'delete':
      return ['archive', 'delete']
    default:
      return []
  }
}
