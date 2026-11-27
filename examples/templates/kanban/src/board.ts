import type { User } from '@supabase/supabase-js'
import type { Card, CardStatus } from './collections'
import { supabase, type Board } from './supabase'

// Boards and memberships are one-off setup calls, so they use supabase-js
// directly. Cards, which change live, go through the TanStack DB collection.

const STARTER_CARDS: { title: string; status: CardStatus }[] = [
  { title: 'Drag me to "Doing"', status: 'todo' },
  { title: 'Open this board in a second window', status: 'todo' },
  { title: 'Share the invite link with a teammate', status: 'todo' },
  { title: 'Read the migration in supabase/migrations', status: 'doing' },
  { title: 'Sign in anonymously', status: 'done' },
]

let sessionUser: Promise<User> | null = null

/**
 * Signs in anonymously when there is no session, so the app works without a
 * login. Shared, so concurrent callers (such as React StrictMode running an
 * effect twice) never create two anonymous users.
 */
export function ensureSession(): Promise<User> {
  sessionUser ??= (async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) return data.session.user
    const { data: signIn, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return signIn.user!
  })().catch((error) => {
    sessionUser = null
    throw error
  })
  return sessionUser
}

/**
 * Opens the board in the URL (joining it if needed), else the user's most
 * recent board, else a new one with a few starter cards.
 */
async function loadBoard(boardIdFromUrl: string | null): Promise<Board> {
  if (boardIdFromUrl) {
    const { error: joinError } = await supabase
      .from('board_members')
      .upsert(
        { board_id: boardIdFromUrl },
        { onConflict: 'board_id,user_id', ignoreDuplicates: true }
      )
    if (joinError) throw joinError
    const { data, error } = await supabase
      .from('boards')
      .select('id, name')
      .eq('id', boardIdFromUrl)
      .single()
    if (error) throw error
    return data
  }

  const { data: existing, error: listError } = await supabase
    .from('boards')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(1)
  if (listError) throw listError
  if (existing.length > 0) return existing[0]

  const { data: board, error } = await supabase
    .from('boards')
    .insert({ name: 'Product launch' })
    .select('id, name')
    .single()
  if (error) throw error

  const { error: cardsError } = await supabase
    .from('cards')
    .insert(
      STARTER_CARDS.map((card, index) => ({ ...card, board_id: board.id, position: index + 1 }))
    )
  if (cardsError) throw cardsError
  return board
}

let openingBoard: Promise<Board> | null = null

/** Shared for the same reason as ensureSession: one board per page load, even under StrictMode. */
export function openBoard(boardIdFromUrl: string | null): Promise<Board> {
  openingBoard ??= loadBoard(boardIdFromUrl).catch((error) => {
    openingBoard = null
    throw error
  })
  return openingBoard
}

/** Position for a card dropped between `before` and `after` (either may be missing). */
export function positionBetween(before?: Card, after?: Card) {
  if (before && after) return (before.position + after.position) / 2
  if (before) return before.position + 1
  if (after) return after.position - 1
  return 1
}
