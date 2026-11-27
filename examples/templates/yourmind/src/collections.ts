import { supabaseCollectionOptions } from '@supabase-labs/tanstack-db'
import { createCollection } from '@tanstack/react-db'
import { z } from 'zod'

import { supabase } from './supabase'

export const itemSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['note', 'link', 'image']),
  title: z.string().nullable(),
  body: z.string().nullable(),
  url: z.string().nullable(),
  site_name: z.string().nullable(),
  image_url: z.string().nullable(),
  image_path: z.string().nullable(),
  status: z.enum(['processing', 'ready', 'failed']),
  created_by: z.uuid(),
  created_at: z.string(),
})

export type Item = z.infer<typeof itemSchema>

/**
 * Your saved items, synced with the `items` table. Saves and deletes apply
 * instantly; when the save-item function adds a link preview, the update
 * arrives over Realtime.
 */
export const items = createCollection(
  supabaseCollectionOptions({
    tableName: 'items',
    schema: itemSchema,
    keys: ['id'],
    supabase,
    realtime: true,
  })
)
