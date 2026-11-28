import { eq, useLiveQuery } from '@tanstack/react-db'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'

import { photos, type Photo } from './collections'
import { photoUrl, type Wall } from './supabase'
import { ThemeSwitch } from './ThemeSwitch'
import { createSamplePhotos, deletePhoto, ensureSession, openWall, uploadPhoto } from './wall'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; wall: Wall; userId: string }

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  // Sign in and open a wall once.
  useEffect(() => {
    let isCancelled = false
    const wallIdFromUrl = new URLSearchParams(window.location.search).get('wall')
    ensureSession()
      .then(async (user) => {
        const wall = await openWall(wallIdFromUrl)
        if (isCancelled) return
        window.history.replaceState(null, '', `?wall=${wall.id}`)
        setState({ status: 'ready', wall, userId: user.id })
      })
      .catch((error: Error) => {
        if (!isCancelled) setState({ status: 'error', message: error.message })
      })
    return () => {
      isCancelled = true
    }
  }, [])

  if (state.status === 'loading') return <Centered>Setting up your wall…</Centered>
  if (state.status === 'error') return <Centered>Couldn’t load the wall: {state.message}</Centered>
  return <PhotoWall wall={state.wall} userId={state.userId} />
}

interface Upload {
  id: string
  previewUrl: string
  aspectRatio: number
  error?: string
}

function PhotoWall({ wall, userId }: { wall: Wall; userId: string }) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [openPhoto, setOpenPhoto] = useState<Photo | null>(null)
  const lightboxTrigger = useRef<HTMLElement | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // A live query: new photos from anyone on the wall appear without a refresh.
  const { data: wallPhotos = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ photo: photos })
        .where(({ photo }) => eq(photo.wall_id, wall.id))
        .orderBy(({ photo }) => photo.created_at, 'desc'),
    [wall.id]
  )

  const addFiles = async (files: Blob[]) => {
    const batch = await Promise.all(
      files.map(async (file) => {
        const previewUrl = URL.createObjectURL(file)
        const bitmap = await createImageBitmap(file).catch(() => null)
        const aspectRatio = bitmap ? bitmap.width / bitmap.height : 1
        bitmap?.close()
        return { id: crypto.randomUUID(), previewUrl, aspectRatio, file }
      })
    )
    setUploads((current) => [...batch.map(({ file: _file, ...upload }) => upload), ...current])

    await Promise.all(
      batch.map(async ({ id, previewUrl, file }) => {
        try {
          await uploadPhoto(wall.id, userId, file)
          setUploads((current) => current.filter((upload) => upload.id !== id))
          URL.revokeObjectURL(previewUrl)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Upload failed'
          setUploads((current) =>
            current.map((upload) => (upload.id === id ? { ...upload, error: message } : upload))
          )
        }
      })
    )
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith('image/'))
    if (files.length > 0) addFiles(files)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])]
    if (files.length > 0) addFiles(files)
    event.target.value = ''
  }

  const isEmpty = !isLoading && wallPhotos.length === 0 && uploads.length === 0

  return (
    <div
      className="flex min-h-dvh flex-col"
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false)
      }}
      onDrop={handleDrop}
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-background/90 px-5 py-3 backdrop-blur">
        <div className="size-6 rounded-md bg-gradient-to-br from-fuchsia-400 to-orange-400" />
        <h1 className="text-[15px] font-medium">{wall.name}</h1>
        <span className="text-xs text-muted">{wallPhotos.length} photos</span>
        <div className="ml-auto flex items-center gap-3">
          <ThemeSwitch />
          <InviteButton />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            Add photos
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
      </header>

      <main className="flex-1 p-5">
        {isLoading && <Centered>Loading photos…</Centered>}
        {isEmpty && (
          <div className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong p-10 text-center">
            <p className="text-sm font-medium">Drop photos anywhere to add them</p>
            <p className="text-sm text-muted">
              Everyone with the invite link sees them appear live. Up to 5 MB each.
            </p>
            <button
              type="button"
              onClick={async () => addFiles(await createSamplePhotos())}
              className="rounded-md border border-line-strong px-3 py-1.5 text-xs hover:bg-hover"
            >
              Add sample photos
            </button>
          </div>
        )}
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {uploads.map((upload) => (
            <figure
              key={upload.id}
              className="relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-surface"
              style={{ aspectRatio: upload.aspectRatio }}
            >
              <img src={upload.previewUrl} alt="" className="size-full object-cover opacity-60" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-1.5 text-xs">
                {upload.error ?? 'Uploading…'}
              </figcaption>
            </figure>
          ))}
          {wallPhotos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              canDelete={photo.created_by === userId}
              onOpen={(trigger) => {
                lightboxTrigger.current = trigger
                setOpenPhoto(photo)
              }}
            />
          ))}
        </div>
      </main>

      {isDragging && (
        <div className="pointer-events-none fixed inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-fuchsia-400 bg-background/70 text-sm font-medium">
          Drop to add to the wall
        </div>
      )}
      {openPhoto && (
        <Lightbox
          photo={openPhoto}
          onClose={() => {
            setOpenPhoto(null)
            // Return focus to the photo that opened the lightbox.
            lightboxTrigger.current?.focus()
          }}
        />
      )}
    </div>
  )
}

/**
 * A resized photo that falls back to the original file if resizing isn't
 * available (image transformations need a paid plan).
 */
function PhotoImage({ path, width, alt, className }: { path: string; width: number; alt: string; className: string }) {
  const [isResizeFailed, setIsResizeFailed] = useState(false)
  return (
    <img
      src={photoUrl(path, isResizeFailed ? undefined : width)}
      alt={alt}
      loading="lazy"
      onError={() => setIsResizeFailed(true)}
      className={className}
    />
  )
}

function PhotoTile({
  photo,
  canDelete,
  onOpen,
}: {
  photo: Photo
  canDelete: boolean
  onOpen: (trigger: HTMLElement) => void
}) {
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deletePhoto(photo.id, photo.path)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete the photo')
      setIsDeleting(false)
    }
  }

  return (
    <figure
      className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-surface"
      style={{ aspectRatio: photo.width / photo.height }}
    >
      <button
        type="button"
        onClick={(event) => onOpen(event.currentTarget)}
        className="block size-full"
        aria-label="Open photo"
      >
        <PhotoImage
          path={photo.path}
          width={600}
          alt={photo.caption ?? ''}
          className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
        />
      </button>
      {canDelete && (
        <button
          type="button"
          aria-label="Delete photo"
          disabled={isDeleting}
          onClick={handleDelete}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 text-sm opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
        >
          ×
        </button>
      )}
      {deleteError && (
        <figcaption role="alert" className="absolute inset-x-0 bottom-0 bg-background/90 px-3 py-1.5 text-xs text-red-500">
          {deleteError}
        </figcaption>
      )}
    </figure>
  )
}

function Lightbox({
  photo,
  onClose,
}: {
  photo: Photo
  onClose: () => void
}) {
  const dialog = useRef<HTMLDivElement>(null)

  // Move focus into the dialog, keep Tab inside it, close on Escape.
  useEffect(() => {
    dialog.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        event.preventDefault()
        dialog.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Photo. Press Escape to close."
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/85 p-6 outline-none"
    >
      <PhotoImage
        path={photo.path}
        width={1600}
        alt={photo.caption ?? ''}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </div>
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
    <div className="flex min-h-[50dvh] flex-1 items-center justify-center text-sm text-muted">
      {children}
    </div>
  )
}
