import { supabaseCollectionOptions } from '@supabase-labs/tanstack-db'
import { createCollection } from '@tanstack/react-db'
import { z } from 'zod'

import { supabase } from './supabase'

export const cardSchema = z.object({
  id: z.uuid(),
  board_id: z.uuid(),
  title: z.string().min(1).max(200),
  status: z.enum(['todo', 'doing', 'done']),
  // Fractional position: a move sets this to the midpoint of its new
  // neighbours, so reordering only ever updates one row.
  position: z.number(),
})

export type Card = z.infer<typeof cardSchema>
export type CardStatus = Card['status']

/**
 * Cards, synced with the `cards` table. Live queries re-render when rows
 * change, mutations apply optimistically and roll back if Postgres (or RLS)
 * rejects them, and Realtime brings in other members' changes.
 */
export const cards = createCollection(
  supabaseCollectionOptions({
    tableName: 'cards',
    schema: cardSchema,
    keys: ['id'],
    supabase,
    realtime: true,
    // Only subscribe to changes for the board being viewed, using the live
    // query's `where` as the Realtime filter.
    realtimeUseFilter: true,
  })
)
