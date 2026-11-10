import type {
  TableRelatedFunction,
  TableRelatedTrigger,
} from '@/data/database/table-related-resources-query'

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

export function formatRelatedFunctionDetails({
  type,
  args,
}: Pick<TableRelatedFunction, 'type' | 'args'>) {
  const kind = type === 'procedure' ? 'Procedure' : 'Function'
  return args.length === 0 ? kind : `${kind} (${args})`
}
