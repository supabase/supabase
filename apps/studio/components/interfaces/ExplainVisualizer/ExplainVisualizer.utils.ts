import {
  Activity,
  Database,
  GitMerge,
  Hash,
  ListFilter,
  SortAsc,
  Zap,
  Layers,
  type LucideIcon,
} from 'lucide-react'

// Get human-readable description for an operation
export function getOperationDescription(operation: string): string {
  const op = operation.toLowerCase()

  if (op.includes('seq scan')) {
    return 'Reads entire table row by row'
  }
  if (op.includes('index only scan')) {
    return 'Reads data directly from index (fastest)'
  }
  if (op.includes('bitmap index scan')) {
    return 'Builds bitmap of matching rows from index'
  }
  if (op.includes('bitmap heap scan')) {
    return 'Fetches rows using bitmap'
  }
  if (op.includes('index scan')) {
    return 'Uses index to find matching rows'
  }
  if (op.includes('hash left join')) {
    return 'Returns all left rows with matching right rows via hash'
  }
  if (op.includes('hash right join')) {
    return 'Returns all right rows with matching left rows via hash'
  }
  if (op.includes('hash full join')) {
    return 'Returns all rows from both tables via hash'
  }
  if (op.includes('hash anti join')) {
    return 'Returns rows without matches via hash'
  }
  if (op.includes('hash semi join')) {
    return 'Returns rows with at least one match via hash'
  }
  if (op.includes('hash join')) {
    return 'Joins tables using hash lookup'
  }
  if (op.includes('merge left join')) {
    return 'Returns all left rows with matching right rows via merge'
  }
  if (op.includes('merge right join')) {
    return 'Returns all right rows with matching left rows via merge'
  }
  if (op.includes('merge full join')) {
    return 'Returns all rows from both tables via merge'
  }
  if (op.includes('merge anti join')) {
    return 'Returns rows without matches via merge'
  }
  if (op.includes('merge semi join')) {
    return 'Returns rows with at least one match via merge'
  }
  if (op.includes('merge join')) {
    return 'Joins pre-sorted tables'
  }
  if (op.includes('nested loop left join')) {
    return 'Returns all left rows with matching right rows via loop'
  }
  if (op.includes('nested loop anti join')) {
    return 'Returns rows without matches via loop'
  }
  if (op.includes('nested loop semi join')) {
    return 'Returns rows with at least one match via loop'
  }
  if (op.includes('nested loop')) {
    return 'Joins by looping through each row'
  }
  if (op === 'hash') {
    return 'Builds hash table for fast lookups'
  }
  if (op.includes('sort')) {
    return 'Sorts rows for output or join'
  }
  if (op.includes('aggregate') || op.includes('group')) {
    return 'Groups rows and calculates aggregates'
  }
  if (op.includes('limit')) {
    return 'Returns only first N rows'
  }
  if (op.includes('materialize')) {
    return 'Stores results in memory for reuse'
  }
  if (op.includes('gather')) {
    return 'Collects results from parallel workers'
  }

  return ''
}

// Get an icon for the operation type
export function getOperationIcon(operation: string): LucideIcon {
  const op = operation.toLowerCase()
  if (op === 'hash') return Hash
  if (op.includes('hash join')) return GitMerge
  if (op.includes('merge join')) return GitMerge
  if (op.includes('nested loop')) return GitMerge
  if (op.includes('join')) return Layers
  if (op.includes('index')) return Zap
  if (op.includes('seq scan')) return Database
  if (op.includes('scan')) return Database
  if (op.includes('filter')) return ListFilter
  if (op.includes('sort')) return SortAsc
  if (op.includes('aggregate') || op.includes('group')) return Activity
  return Database
}

// Get a color class for the operation type
export function getOperationColor(operation: string): string {
  const op = operation.toLowerCase()
  if (op.includes('seq scan')) return 'text-warning'
  if (op.includes('index')) return 'text-brand'
  if (op.includes('join')) return 'text-foreground-light'
  if (op.includes('sort') || op.includes('aggregate')) return 'text-foreground-light'
  return 'text-foreground-light'
}

export function isExplainQuery(rows: readonly any[]): boolean {
  return (
    rows.length > 0 && rows[0].hasOwnProperty('QUERY PLAN') && Object.keys(rows[0]).length === 1
  )
}
