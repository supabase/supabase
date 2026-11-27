import { useLiveQuery } from '@tanstack/react-db'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { items, type Item } from './collections'
import {
  deleteItem,
  imageUrl,
  processPending,
  saveImage,
  saveText,
  searchMind,
  seedMind,
} from './mind'
import { ensureSession } from './session'
import { ThemeSwitch } from './ThemeSwitch'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; userId: string }

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let isCancelled = false
    ensureSession()
      .then(async (user) => {
        await seedMind(user.id)
        if (!isCancelled) setState({ status: 'ready', userId: user.id })
      })
      .catch((error: Error) => {
        if (!isCancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-6 pt-5">
        <h1 className="font-serif text-xl tracking-tight">
          Your<span className="italic">Mind</span>
        </h1>
        <div className="ml-auto">
          <ThemeSwitch />
        </div>
      </header>
      {state.status === 'loading' && <Centered>Opening your mind…</Centered>}
      {state.status === 'error' && <Centered>Couldn’t load: {state.message}</Centered>}
      {state.status === 'ready' && <Mind userId={state.userId} />}
    </div>
  )
}

type Search =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'done'; query: string; ids: string[] }
  | { status: 'error'; query: string; message: string }

function Mind({ userId }: { userId: string }) {
  const [search, setSearch] = useState<Search>({ status: 'idle' })
  const [openItem, setOpenItem] = useState<Item | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // A live query over everything you've saved, newest first. Link previews
  // arrive over Realtime when the save-item function finishes.
  const { data: allItems = [], isLoading } = useLiveQuery((q) =>
    q.from({ item: items }).orderBy(({ item }) => item.created_at, 'desc')
  )

  // Finish saving anything still processing (new starter items, or a save
  // that was interrupted when the tab closed).
  useEffect(() => {
    if (!isLoading) processPending(allItems)
  }, [allItems, isLoading])

  const visibleItems =
    search.status === 'done'
      ? search.ids.flatMap((id) => allItems.filter((item) => item.id === id))
      : allItems

  const handleFiles = async (files: File[]) => {
    setUploadError(null)
    for (const file of files) {
      try {
        await saveImage(userId, file)
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed')
      }
    }
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith('image/'))
    if (files.length > 0) {
      handleFiles(files)
      return
    }
    const text = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text')
    if (!text.trim()) return
    setUploadError(null)
    saveText(userId, text).catch((error: unknown) =>
      setUploadError(error instanceof Error ? error.message : 'Could not save that')
    )
  }

  return (
    <main
      className="flex flex-1 flex-col gap-6 px-6 pb-12 pt-6"
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false)
      }}
      onDrop={handleDrop}
    >
      <SearchBar search={search} onSearch={setSearch} />
      {search.status === 'idle' && (
        <Composer userId={userId} onFiles={handleFiles} error={uploadError} />
      )}
      {search.status === 'searching' && (
        <p className="text-center text-sm text-muted">Searching your mind…</p>
      )}
      {search.status === 'error' && (
        <p className="text-center text-sm text-red-500">{search.message}</p>
      )}
      {search.status === 'done' && (
        <p className="text-center text-sm text-muted">
          {search.ids.length === 0
            ? `Nothing in your mind matches “${search.query}” yet.`
            : `${search.ids.length} ${search.ids.length === 1 ? 'thing' : 'things'} related to “${search.query}”`}
        </p>
      )}
      {isLoading && <Centered>Loading…</Centered>}
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {visibleItems.map((item) => (
          <ItemCard key={item.id} item={item} onOpen={() => setOpenItem(item)} />
        ))}
      </div>
      {isDragging && (
        <div className="pointer-events-none fixed inset-3 z-20 flex items-center justify-center rounded-3xl border-2 border-dashed border-line-strong bg-background/70 font-serif text-lg">
          Drop to remember
        </div>
      )}
      {openItem && (
        <ItemDialog
          item={allItems.find((item) => item.id === openItem.id) ?? openItem}
          onClose={() => setOpenItem(null)}
        />
      )}
    </main>
  )
}

function SearchBar({ search, onSearch }: { search: Search; onSearch: (search: Search) => void }) {
  const [query, setQuery] = useState('')
  // Bumped on every search and on Clear, so a slow response for an older
  // query can't replace newer results or a cleared search.
  const latestSearch = useRef(0)

  const clear = () => {
    latestSearch.current += 1
    onSearch({ status: 'idle' })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      clear()
      return
    }
    const request = ++latestSearch.current
    onSearch({ status: 'searching', query: trimmed })
    try {
      const ids = await searchMind(trimmed)
      if (request === latestSearch.current) onSearch({ status: 'done', query: trimmed, ids })
    } catch (error) {
      if (request !== latestSearch.current) return
      onSearch({
        status: 'error',
        query: trimmed,
        message: error instanceof Error ? error.message : 'Search failed',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your mind…"
        aria-label="Search your mind by meaning"
        className="w-full border-b border-line-strong bg-transparent py-3 font-serif text-3xl italic placeholder:text-muted focus:border-foreground focus:outline-none sm:text-4xl"
      />
      {search.status !== 'idle' && (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            clear()
          }}
          className="shrink-0 rounded-full border border-line-strong px-3 py-1 text-xs hover:bg-hover"
        >
          Clear
        </button>
      )}
    </form>
  )
}

function Composer({
  userId,
  onFiles,
  error,
}: {
  userId: string
  onFiles: (files: File[]) => void
  error: string | null
}) {
  const [text, setText] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const save = async () => {
    if (!text.trim()) return
    const submitted = text
    setSaveError(null)
    setText('')
    try {
      await saveText(userId, submitted)
    } catch (error) {
      // Give the text back unless something new has been typed since.
      setText((current) => current || submitted)
      setSaveError(error instanceof Error ? error.message : 'Could not save that')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      save()
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])]
    if (files.length > 0) onFiles(files)
    event.target.value = ''
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
      <div className="flex items-start gap-2 rounded-2xl border border-line bg-card p-2 shadow-sm">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Paste a link or write a thought, then press Enter"
          aria-label="Save a link or note"
          className="min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-xl px-3 py-2 text-xs text-muted hover:bg-hover hover:text-foreground"
        >
          Add image
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!text.trim()}
          className="rounded-xl bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-30"
        >
          Save
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </div>
      {(saveError ?? error) && (
        <p role="alert" className="px-2 text-xs text-red-500">
          {saveError ?? error}
        </p>
      )}
    </div>
  )
}

function ItemCard({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const isProcessing = item.status === 'processing'
  return (
    <article className="group relative mb-4 break-inside-avoid">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full overflow-hidden rounded-2xl border border-line bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        {item.kind === 'note' && (
          <p className="whitespace-pre-wrap p-5 font-serif text-[17px] leading-snug">{item.body}</p>
        )}
        {item.kind === 'link' && <LinkPreview item={item} />}
        {item.kind === 'image' && item.image_path && <StoredImage path={item.image_path} />}
      </button>
      {isProcessing && (
        <span className="absolute left-3 top-3 animate-pulse rounded-full bg-background/90 px-2 py-0.5 text-[11px] text-muted">
          Reading…
        </span>
      )}
    </article>
  )
}

function LinkPreview({ item }: { item: Item }) {
  const [hasImageError, setHasImageError] = useState(false)
  const host = item.site_name ?? (item.url ? new URL(item.url).hostname : '')
  return (
    <div>
      {item.image_url && !hasImageError && (
        <img
          src={item.image_url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasImageError(true)}
          className="aspect-[1.91/1] w-full bg-surface object-cover"
        />
      )}
      <div className="flex flex-col gap-1 p-4">
        <p className="line-clamp-3 text-sm font-medium">{item.title ?? item.url}</p>
        <p className="truncate text-xs text-muted">{host}</p>
      </div>
    </div>
  )
}

function StoredImage({ path, width = 600 }: { path: string; width?: number }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    imageUrl(path, width).then((url) => {
      if (!isCancelled) setSrc(url)
    })
    return () => {
      isCancelled = true
    }
  }, [path, width])

  if (!src) return <div className="aspect-square w-full animate-pulse bg-surface" />
  return <img src={src} alt="" className="w-full" />
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])'

function ItemDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Focus the dialog on open, keep Tab inside it, close on Escape, and return
  // focus to whatever opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      opener?.focus()
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title ?? 'Saved item'}
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        ref={panel}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-3xl border border-line bg-card p-6 shadow-2xl outline-none"
      >
        {item.kind === 'image' && item.image_path && (
          <div className="overflow-hidden rounded-2xl">
            <StoredImage path={item.image_path} width={1200} />
          </div>
        )}
        {item.kind === 'link' && item.image_url && (
          <img
            src={item.image_url}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full rounded-2xl"
          />
        )}
        {item.title && <h2 className="font-serif text-2xl leading-tight">{item.title}</h2>}
        {item.body && (
          <p
            className={`whitespace-pre-wrap text-subtle ${item.kind === 'note' ? 'font-serif text-xl text-foreground' : 'text-sm'}`}
          >
            {item.body}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>Saved {new Date(item.created_at).toLocaleString()}</span>
          {item.status === 'failed' && <span className="text-red-500">Couldn’t read this one</span>}
          {deleteError && (
            <span role="alert" className="text-red-500">
              {deleteError}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line-strong px-3 py-1 text-foreground hover:bg-hover"
              >
                Open link
              </a>
            )}
            <button
              type="button"
              onClick={async () => {
                setDeleteError(null)
                try {
                  await deleteItem(item)
                  onClose()
                } catch (error) {
                  setDeleteError(error instanceof Error ? error.message : 'Could not forget this')
                }
              }}
              className="rounded-full border border-line-strong px-3 py-1 text-foreground hover:bg-hover"
            >
              Forget
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[40dvh] flex-1 items-center justify-center text-sm text-muted">
      {children}
    </div>
  )
}
