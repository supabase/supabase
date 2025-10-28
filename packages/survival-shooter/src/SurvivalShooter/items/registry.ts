import type { GameItem } from './base'

type ItemKey = GameItem['id']

class ItemRegistry {
  private readonly items = new Map<ItemKey, GameItem>()

  register(item: GameItem) {
    this.items.set(item.id, item)
    return item
  }

  getAll(): GameItem[] {
    return Array.from(this.items.values())
  }

  getById(id: ItemKey): GameItem | undefined {
    return this.items.get(id)
  }
}

export const itemRegistry = new ItemRegistry()

export function defineItem<T extends GameItem>(item: T): T {
  return itemRegistry.register(item)
}
