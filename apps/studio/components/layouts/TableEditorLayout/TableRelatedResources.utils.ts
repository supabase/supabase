import type {
  TableRelatedFunction,
  TableRelatedIndex,
  TableRelatedTrigger,
} from '@/data/database/table-related-resources-query'

// Past this, naming every column makes the description wider than the row can
// show. A count is more use than a column name cut in half.
const MAX_LISTED_INDEX_COLUMNS = 3

/**
 * Badges for the command menu's "Related resources" section. Everything there
 * belongs to the table that is already open, so the badges name the kind of
 * resource rather than repeating the table.
 */

export function formatRelatedPolicyDetails(command: string) {
  return `Policy • ${command}`
}

export function formatRelatedTriggerDetails({
  activation,
  events,
}: Pick<TableRelatedTrigger, 'activation' | 'events'>) {
  return `Trigger • ${activation} ${events.join(' OR ')}`
}

// Primary keys and unique constraints each create an index of their own. Name
// them for what the user made, not for the index behind it.
function getIndexKind({
  is_primary,
  is_unique,
}: Pick<TableRelatedIndex, 'is_primary' | 'is_unique'>) {
  if (is_primary) return 'Primary key'
  if (is_unique) return 'Unique'
  return 'Index'
}

export function formatRelatedIndexDetails({
  columns,
  is_primary,
  is_unique,
}: Pick<TableRelatedIndex, 'columns' | 'is_primary' | 'is_unique'>) {
  const kind = getIndexKind({ is_primary, is_unique })
  if (columns.length === 0) return kind
  if (columns.length > MAX_LISTED_INDEX_COLUMNS) return `${kind} • On ${columns.length} columns`
  return `${kind} • On ${columns.join(', ')}`
}

export function formatRelatedFunctionDetails({
  type,
  args,
}: Pick<TableRelatedFunction, 'type' | 'args'>) {
  const kind = type === 'procedure' ? 'Procedure' : 'Function'
  return args.length === 0 ? kind : `${kind} (${args})`
}
