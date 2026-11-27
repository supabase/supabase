import { supabaseCollectionOptions } from '@supabase-labs/tanstack-db'
import { createCollection } from '@tanstack/react-db'
import { z } from 'zod'

import { supabase } from './supabase'

export const photoSchema = z.object({
  id: z.uuid(),
  wall_id: z.uuid(),
  path: z.string(),
  caption: z.string().nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  created_by: z.uuid(),
  created_at: z.string(),
})

export type Photo = z.infer<typeof photoSchema>

/**
 * Photo rows, synced with the `photos` table. New photos from other members
 * arrive over Realtime; deletes apply optimistically and roll back if RLS
 * rejects them.
 */
export const photos = createCollection(
  supabaseCollectionOptions({
    tableName: 'photos',
    schema: photoSchema,
    keys: ['id'],
    supabase,
    realtime: true,
    // Only subscribe to changes for the wall being viewed.
    realtimeUseFilter: true,
  })
)
