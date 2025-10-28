/* eslint-disable @typescript-eslint/no-var-requires */
import type { GameItem } from './base'
import { itemRegistry } from './registry'

// Export all items
export * from './base'

declare const require: {
  context: (path: string, includeSubdirectories: boolean, regExp: RegExp) => {
    keys: () => string[]
    <T>(id: string): T
  }
}

// Automatically register every item file in this directory (excluding helpers)
const itemContext =
  typeof require === 'function'
    ? require.context('./', false, /^(?!.*(?:index|base|registry)).*\.ts$/)
    : null

itemContext?.keys().forEach((key) => {
    itemContext(key)
})

// Item registry helpers
export const ALL_ITEMS: GameItem[] = itemRegistry.getAll()

export function getItemById(id: string): GameItem | undefined {
  return itemRegistry.getById(id)
}
