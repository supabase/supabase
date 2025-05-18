export type WarehouseQueryTemplate = {
  query: string
  name: string
  description: string
}

export function createWarehouseQueryTemplates(
  collections: { name: string }[]
): WarehouseQueryTemplate[] {
  return collections.flatMap((collection) => [
    {
      query: `select count(*) as event_count from \`${collection.name}\`
where timestamp > timestamp_sub(current_timestamp(), interval 1 day)`,
      name: `${collection.name} - Daily Event Count`,
      description: `Count events in the last 24 hours from ${collection.name} collection`,
    },
    {
      query: `select id, timestamp, event_message from \`${collection.name}\`
        where timestamp > timestamp_sub(current_timestamp(), interval 1 day) 
        and event_message like '%YOUR_TEXT_HERE%'
        order by timestamp desc limit 10`,
      name: `${collection.name} - Filter by text`,
      description: `Select last 10 events from ${collection.name} collection`,
    },
  ])
}
