import type { ReactNode } from 'react'
import {
  type LucideIcon,
  CircleDollarSign,
  Clock,
  Columns3,
  Layers,
  Rows3,
  Table,
} from 'lucide-react'

const icon = (Component: LucideIcon) => <Component size={10} strokeWidth={1} className="mr-1" />

export type QueryPlanMetricId =
  | 'parallel-helpers'
  | 'total-time'
  | 'self-time'
  | 'rows-seen'
  | 'rows-filtered'
  | 'rows-join-filter'
  | 'rows-index-recheck'
  | 'row-size'
  | 'total-cost'
  | 'self-cost'
  | 'startup-cost'
  | 'table-fetches'
  | 'buffers-shared'
  | 'buffers-temp'
  | 'buffers-local'
  | 'columns-returned'
  | 'io-time'
  | 'loops'
  | 'loops-observed'
  | 'rows-across-loops'
  | 'total-time-per-loop'
  | 'total-time-all-loops'

export type MetricDefinition = {
  id: QueryPlanMetricId
  label: string
  description?: string
  icon?: ReactNode
}

const METRIC_DEFINITIONS: Record<QueryPlanMetricId, MetricDefinition> = {
  'parallel-helpers': {
    id: 'parallel-helpers',
    label: 'Parallel helpers',
    description:
      'Postgres can launch helper processes to run this step in parallel. Planned = expected helpers, Started = helpers that actually ran.',
  },
  'total-time': {
    id: 'total-time',
    label: 'Total time',
    description: 'Time spent on this step including any child steps.',
    icon: icon(Clock),
  },
  'self-time': {
    id: 'self-time',
    label: 'Self time',
    description: 'Time spent only inside this node. Child steps are not included.',
    icon: icon(Clock),
  },
  'rows-seen': {
    id: 'rows-seen',
    label: 'Rows seen',
    description: 'Rows processed versus what the planner expected.',
    icon: icon(Rows3),
  },
  'rows-filtered': {
    id: 'rows-filtered',
    label: 'Filtered out rows',
    description: 'Rows skipped because a WHERE or filter condition returned false.',
    icon: icon(Rows3),
  },
  'rows-join-filter': {
    id: 'rows-join-filter',
    label: 'Join filter drops',
    description: 'Rows dropped because the join filter did not match.',
    icon: icon(Rows3),
  },
  'rows-index-recheck': {
    id: 'rows-index-recheck',
    label: 'Index recheck drops',
    description: 'Rows removed after an index recheck (commonly due to visibility rules).',
    icon: icon(Rows3),
  },
  'row-size': {
    id: 'row-size',
    label: 'Row size',
    description: 'Average bytes per row output by this step.',
    icon: icon(Rows3),
  },
  'total-cost': {
    id: 'total-cost',
    label: 'Total cost',
    description: 'Planner cost units (not milliseconds). Shows the total cost.',
    icon: icon(CircleDollarSign),
  },
  'self-cost': {
    id: 'self-cost',
    label: 'Self cost',
    description: 'Portion of the planner cost assigned only to this step.',
    icon: icon(CircleDollarSign),
  },
  'startup-cost': {
    id: 'startup-cost',
    label: 'Startup cost',
    description: 'Planner cost required before producing the first row.',
    icon: icon(CircleDollarSign),
  },
  'table-fetches': {
    id: 'table-fetches',
    label: 'Table fetches',
    description: 'Rows fetched directly from the table because they were not already in cache.',
    icon: icon(Layers),
  },
  'buffers-shared': {
    id: 'buffers-shared',
    label: 'Shared cache (self)',
    description: 'Shared cache blocks touched (all runs vs. just this node).',
    icon: icon(Layers),
  },
  'buffers-temp': {
    id: 'buffers-temp',
    label: 'Temporary blocks (self)',
    description: 'Temporary blocks written to disk for this step.',
    icon: icon(Layers),
  },
  'buffers-local': {
    id: 'buffers-local',
    label: 'Local cache (self)',
    description: 'Local cache blocks touched (per worker memory).',
    icon: icon(Layers),
  },
  'columns-returned': {
    id: 'columns-returned',
    label: 'Columns returned',
    description: 'Columns passed to the next step.',
    icon: icon(Columns3),
  },
  'io-time': {
    id: 'io-time',
    label: 'Disk I/O time',
    description: 'Time spent performing disk reads and writes for this step.',
    icon: icon(Table),
  },
  loops: {
    id: 'loops',
    label: 'Loops',
    description: 'How many times the node executed.',
  },
  'loops-observed': {
    id: 'loops-observed',
    label: 'Loops observed',
    description: 'Loops actually observed when the query ran.',
  },
  'rows-across-loops': {
    id: 'rows-across-loops',
    label: 'Rows across loops',
    description: 'Rows produced across all loops combined.',
  },
  'total-time-per-loop': {
    id: 'total-time-per-loop',
    label: 'Total time (per loop)',
    description: 'Time spent on the node including child steps for a single loop.',
  },
  'total-time-all-loops': {
    id: 'total-time-all-loops',
    label: 'All loops combined',
    description: 'Total time including every loop for this node.',
  },
}

export const getMetricDefinition = (id: QueryPlanMetricId): MetricDefinition =>
  METRIC_DEFINITIONS[id]
