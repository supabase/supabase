import { convex } from './convex'
import { firebase } from './firebase'
import { neon } from './neon'
import { planetscale } from './planetscale'
import { supabase } from './supabase'
import type { CompetitorProfile } from './types'

// Every profile, in the order they appear in comparison tables.
export const profiles: CompetitorProfile[] = [supabase, neon, planetscale, convex, firebase]
