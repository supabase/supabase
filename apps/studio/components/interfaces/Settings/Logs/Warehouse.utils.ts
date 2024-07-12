export type WarehouseQueryTemplate = {
  query: string
  name: string
  description: string
}

export function createWarehouseQueryTemplates(
  collections: { name: string }[]
): WarehouseQueryTemplate[] {
  return collections.map((collection) => ({
    query:
      'select id, timestamp, event_message from `' +
      collection.name +
      '`\nwhere timestamp > timestamp_sub(current_timestamp(), interval 7 day)\norder by timestamp desc limit 10',
    name: `${collection.name}`,
    description: `Select last 10 events from ${collection.name} collection`,
  }))
}
