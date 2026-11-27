import { useHydrated } from '@tanstack/react-router'
import { ExternalLink, Lock, Monitor, RotateCw, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from 'ui'

type Viewport = 'desktop' | 'mobile'

interface PreviewFrameProps {
  title: string
  /** URL loaded in the iframe. */
  embedUrl: string
  /** URL shown in the address bar and opened by the "open" button. */
  demoUrl: string
}

function getDisplayHost(url: string) {
  try {
    const parsed = new URL(url, 'https://templates.supabase.com')
    return parsed.host + (parsed.pathname === '/' ? '' : parsed.pathname)
  } catch {
    return url
  }
}

/** Browser-style frame around an embedded, interactive app preview. */
export function PreviewFrame({ title, embedUrl, demoUrl }: PreviewFrameProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  // Render the iframe only after hydration: a server-rendered iframe can finish
  // loading before React attaches onLoad, which would leave the overlay up.
  const isHydrated = useHydrated()

  useEffect(() => {
    setIsLoaded(false)
    setIsSlow(false)
    const timer = window.setTimeout(() => setIsSlow(true), 8000)
    return () => window.clearTimeout(timer)
  }, [embedUrl, reloadKey])

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border bg-surface-100 shadow-lg">
      <div className="flex items-center gap-2 border-b bg-surface-75 px-3 py-2">
        <div className="hidden gap-1.5 sm:flex" aria-hidden>
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm text-foreground-light">
          <Lock className="size-3.5 shrink-0" />
          <span className="truncate">{getDisplayHost(demoUrl)}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            label="Desktop view"
            isActive={viewport === 'desktop'}
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Mobile view"
            isActive={viewport === 'mobile'}
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Reload preview" onClick={() => setReloadKey((key) => key + 1)}>
            <RotateCw className="size-4" />
          </ToolbarButton>
          <a
            href={demoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open live demo in a new tab"
            className="flex size-8 items-center justify-center rounded-md text-foreground-light hover:bg-foreground/5 hover:text-foreground"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 justify-center bg-surface-200">
        <div
          className={cn(
            'relative h-full bg-background transition-[max-width] duration-300',
            viewport === 'desktop' ? 'w-full max-w-full' : 'w-full max-w-[390px] border-x'
          )}
        >
          {isHydrated && (
            <iframe
              key={reloadKey}
              title={`${title} live preview`}
              src={embedUrl}
              loading="lazy"
              allow="clipboard-write; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setIsLoaded(true)}
              className="size-full border-0"
            />
          )}
          {/* Always mounted, so screen readers hear the status change. */}
          <p role="status" className="sr-only">
            {isLoaded ? 'Live preview loaded' : 'Loading live preview'}
          </p>
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-100">
              <div className="size-6 rounded-full border-2 border-foreground/15 border-t-brand-default motion-safe:animate-spin" />
              <p aria-hidden className="text-sm text-foreground-light">
                Loading live preview…
              </p>
              {isSlow && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-brand-600 underline underline-offset-4"
                >
                  Taking a while? Open the live demo in a new tab
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  isActive,
  onClick,
  children,
}: {
  label: string
  isActive?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      tabIndex={0}
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-foreground-light hover:bg-foreground/5 hover:text-foreground',
        isActive && 'bg-foreground/10 text-foreground'
      )}
    >
      {children}
    </button>
  )
}
