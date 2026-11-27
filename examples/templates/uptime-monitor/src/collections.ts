import { supabaseCollectionOptions } from '@supabase-labs/tanstack-db'
import { createCollection } from '@tanstack/react-db'
import { z } from 'zod'

import { supabase } from './supabase'

// Each table is a TanStack DB collection: live queries re-render as rows
// change, and Realtime brings in new checks and incidents as the worker
// records them. Row level security limits every collection to your own rows.

export const monitorSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(60),
  url: z.url({ protocol: /^https?$/ }),
  is_paused: z.boolean(),
  created_by: z.uuid(),
  created_at: z.string(),
})

export const checkSchema = z.object({
  id: z.number(),
  monitor_id: z.uuid(),
  checked_at: z.string(),
  is_up: z.boolean(),
  status_code: z.number().nullable(),
  latency_ms: z.number().nullable(),
  error: z.string().nullable(),
})

export const incidentSchema = z.object({
  id: z.uuid(),
  monitor_id: z.uuid(),
  started_at: z.string(),
  resolved_at: z.string().nullable(),
  cause: z.string(),
})

export type Monitor = z.infer<typeof monitorSchema>
export type Check = z.infer<typeof checkSchema>
export type Incident = z.infer<typeof incidentSchema>

export const monitors = createCollection(
  supabaseCollectionOptions({
    tableName: 'monitors',
    schema: monitorSchema,
    keys: ['id'],
    supabase,
    realtime: true,
  })
)

export const checks = createCollection(
  supabaseCollectionOptions({
    tableName: 'checks',
    schema: checkSchema,
    keys: ['id'],
    supabase,
    realtime: true,
  })
)

export const incidents = createCollection(
  supabaseCollectionOptions({
    tableName: 'incidents',
    schema: incidentSchema,
    keys: ['id'],
    supabase,
    realtime: true,
  })
)
