import { eq, useLiveQuery } from '@tanstack/react-db'
import { useEffect, useState, type DragEvent, type FormEvent, type ReactNode } from 'react'

import { ensureSession, openBoard, positionBetween } from './board'
import { cards, type Card, type CardStatus } from './collections'
import { supabase, type Board as BoardRow } from './supabase'
import { ThemeSwitch } from './ThemeSwitch'

const COLUMNS: { status: CardStatus; label: string; dot: string }[] = [
  { status: 'todo', label: 'To do', dot: 'bg-muted' },
  { status: 'doing', label: 'Doing', dot: 'bg-amber-400' },
  { status: 'done', label: 'Done', dot: 'bg-emerald-400' },
]

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; board: BoardRow }

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  // Sign in and open a board once.
  useEffect(() => {
    let isCancelled = false
    const boardIdFromUrl = new URLSearchParams(window.location.search).get('board')
    ensureSession()
      .then(() => openBoard(boardIdFromUrl))
      .then((board) => {
        if (isCancelled) return
        window.history.replaceState(null, '', `?board=${board.id}`)
        setState({ status: 'ready', board })
      })
      .catch((error: Error) => {
        if (!isCancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      isCancelled = true
    }
  }, [])

  if (state.status === 'loading') return <Centered>Setting up your board…</Centered>
  if (state.status === 'error') {
    return <Centered>Couldn’t load the board: {state.message}</Centered>
  }
  return <Board board={state.board} />
}

function Board({ board }: { board: BoardRow }) {
  const onlineCount = useOnlineCount(board.id)

  // A live query: re-renders when any card on this board changes, whether the
  // change is local (optimistic) or arrives from another member over Realtime.
  const { data: boardCards = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ card: cards })
        .where(({ card }) => eq(card.board_id, board.id))
        .orderBy(({ card }) => card.position),
    [board.id]
  )

  const cardsIn = (status: CardStatus) => boardCards.filter((card) => card.status === status)

  // Mutations apply instantly and roll back if Postgres or RLS rejects them.
  const moveCard = (cardId: string, status: CardStatus, beforeCardId: string | null) => {
    const column = cardsIn(status).filter((card) => card.id !== cardId)
    const index = beforeCardId ? column.findIndex((card) => card.id === beforeCardId) : column.length
    const position = positionBetween(column[index - 1], column[index])
    cards.update(cardId, (draft) => {
      draft.status = status
      draft.position = position
    })
  }

  // Keyboard alternative to drag and drop: move to the neighbouring column
  // (as its last card), or one place up or down within the column.
  const nudgeCard = (card: Card, direction: MoveDirection) => {
    if (direction === 'left' || direction === 'right') {
      const index = COLUMNS.findIndex((column) => column.status === card.status)
      const target = COLUMNS[index + (direction === 'left' ? -1 : 1)]
      if (target) moveCard(card.id, target.status, null)
      return
    }
    const column = cardsIn(card.status)
    const index = column.findIndex((item) => item.id === card.id)
    if (direction === 'up' && index > 0) moveCard(card.id, card.status, column[index - 1].id)
    if (direction === 'down' && index < column.length - 1) {
      moveCard(card.id, card.status, column[index + 2]?.id ?? null)
    }
  }

  /** Resolves once the card is saved; rejects if Postgres or RLS refuses it. */
  const addCard = (status: CardStatus, title: string) => {
    const transaction = cards.insert({
      id: crypto.randomUUID(),
      board_id: board.id,
      title,
      status,
      position: positionBetween(cardsIn(status).at(-1)),
    })
    return transaction.isPersisted.promise
  }

  const deleteCard = (cardId: string) => {
    cards.delete(cardId)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-line px-5 py-3">
        <div className="size-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600" />
        <h1 className="text-[15px] font-medium">{board.name}</h1>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span className="size-2 rounded-full bg-emerald-400" />
          {onlineCount} online
        </span>
        <ThemeSwitch />
        <InviteButton />
      </header>
      {isLoading ? (
        <Centered>Loading cards…</Centered>
      ) : (
        <main className="grid flex-1 grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <Column
              key={column.status}
              label={column.label}
              dot={column.dot}
              cards={cardsIn(column.status)}
              onDrop={(cardId, beforeCardId) => moveCard(cardId, column.status, beforeCardId)}
              onAdd={(title) => addCard(column.status, title)}
              onMove={nudgeCard}
              onDelete={deleteCard}
              canMoveLeft={column.status !== 'todo'}
              canMoveRight={column.status !== 'done'}
            />
          ))}
        </main>
      )}
    </div>
  )
}

/** Who else has this board open, via Realtime Presence (not covered by TanStack DB). */
function useOnlineCount(boardId: string) {
  const [onlineCount, setOnlineCount] = useState(1)

  useEffect(() => {
    const channel = supabase.channel(`presence:${boardId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    })
    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Math.max(1, Object.keys(channel.presenceState()).length))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ online_at: new Date().toISOString() })
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId])

  return onlineCount
}

type MoveDirection = 'left' | 'right' | 'up' | 'down'

const MOVES: { direction: MoveDirection; symbol: string; label: string }[] = [
  { direction: 'left', symbol: '←', label: 'Move to previous column' },
  { direction: 'up', symbol: '↑', label: 'Move up' },
  { direction: 'down', symbol: '↓', label: 'Move down' },
  { direction: 'right', symbol: '→', label: 'Move to next column' },
]

function Column({
  label,
  dot,
  cards,
  onDrop,
  onAdd,
  onMove,
  onDelete,
  canMoveLeft,
  canMoveRight,
}: {
  label: string
  dot: string
  cards: Card[]
  onDrop: (cardId: string, beforeCardId: string | null) => void
  onAdd: (title: string) => Promise<unknown>
  onMove: (card: Card, direction: MoveDirection) => void
  onDelete: (cardId: string) => void
  canMoveLeft: boolean
  canMoveRight: boolean
}) {
  const [isOver, setIsOver] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDrop = (event: DragEvent, beforeCardId: string | null) => {
    event.preventDefault()
    event.stopPropagation()
    setIsOver(false)
    const cardId = event.dataTransfer.getData('text/plain')
    if (cardId && cardId !== beforeCardId) onDrop(cardId, beforeCardId)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    setError(null)
    setDraft('')
    try {
      await onAdd(title)
    } catch (addError) {
      // The card rolled back: give the text back unless something new was typed.
      setDraft((current) => current || title)
      setError(addError instanceof Error ? addError.message : 'Could not add the card')
    }
  }

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => handleDrop(event, null)}
      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
        isOver ? 'border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-500/5' : 'border-line bg-surface'
      }`}
    >
      <h2 className="flex items-center gap-2 px-1 pb-1 text-sm font-medium text-subtle">
        <span className={`size-2 rounded-full ${dot}`} />
        {label}
        <span className="text-muted">{cards.length}</span>
      </h2>
      {cards.map((card, index) => (
        <article
          key={card.id}
          draggable
          onDragStart={(event) => event.dataTransfer.setData('text/plain', card.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, card.id)}
          className="group flex cursor-grab items-start gap-2 rounded-lg border border-line bg-card px-3 py-2.5 text-sm shadow-sm active:cursor-grabbing"
        >
          <span className="flex-1">{card.title}</span>
          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {MOVES.map(({ direction, symbol, label: moveLabel }) => {
              const isDisabled =
                (direction === 'left' && !canMoveLeft) ||
                (direction === 'right' && !canMoveRight) ||
                (direction === 'up' && index === 0) ||
                (direction === 'down' && index === cards.length - 1)
              if (isDisabled) return null
              return (
                <button
                  key={direction}
                  type="button"
                  aria-label={`${moveLabel}: ${card.title}`}
                  title={moveLabel}
                  onClick={() => onMove(card, direction)}
                  className="rounded px-1 text-xs text-muted hover:bg-hover hover:text-foreground"
                >
                  {symbol}
                </button>
              )
            })}
            <button
              type="button"
              aria-label={`Delete ${card.title}`}
              title="Delete"
              onClick={() => onDelete(card.id)}
              className="rounded px-1 text-muted hover:bg-hover hover:text-foreground"
            >
              ×
            </button>
          </div>
        </article>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a card"
          aria-label={`Add a card to ${label}`}
          maxLength={200}
          className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:border-line-strong focus:bg-card focus:outline-none"
        />
      </form>
      {error && (
        <p role="alert" className="px-3 text-xs text-red-500">
          {error}
        </p>
      )}
    </section>
  )
}

function InviteButton() {
  const [isCopied, setIsCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          setIsCopied(true)
          window.setTimeout(() => setIsCopied(false), 1500)
        })
      }}
      className="rounded-md border border-line-strong px-2.5 py-1 text-xs hover:bg-hover"
    >
      {isCopied ? 'Copied' : 'Copy invite link'}
    </button>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 min-h-dvh items-center justify-center text-sm text-muted">
      {children}
    </div>
  )
}
