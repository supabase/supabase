import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { PanelBootstrap } from 'surfaces/contract'
import { Button, TooltipProvider } from 'ui'

import { AppProvider } from '../host/app-context'
import {
  connectToHost,
  connectToolView,
  type HostSession,
  type ToolViewSession,
} from '../host/connect'
import type { ToolResult } from '../host/tool-data-port'

import '../styles.css'

export interface SurfaceRenderProps {
  initial: PanelBootstrap
  initialRoute: string
  registerRoute: (onRoute: (path: string) => void) => void
}

function Status({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      role="status"
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <h1 className="text-sm text-foreground">{title}</h1>
      {children}
    </div>
  )
}

interface MountHandlers<S> {
  onReady: (session: S) => void
  onError: (error: Error) => void
  onRoute: (path: string) => void
  onTeardown: () => void
}

/**
 * Mounts one surface: connects to the host (or, in development with
 * `?preview=…`, to fixtures), then renders inside the surface and shell providers.
 */
export function mountSurface(surface: string, render: (props: SurfaceRenderProps) => ReactNode) {
  mount<HostSession>({
    connect: (handlers) => connectToHost({ surface, ...handlers }),
    // Gated here so production builds drop the fixtures.
    preview: import.meta.env.DEV
      ? (name) =>
          import('../preview/session').then(({ createPreviewSession }) =>
            createPreviewSession(surface, name)
          )
      : undefined,
    render: (session, routing) => (
      <AppProvider services={session.services}>
        {render({ initial: session.initial, ...routing })}
      </AppProvider>
    ),
  })
}

/**
 * Mounts a view of one model tool's own result, e.g. the project card on
 * `create_project`. It gets ports for reads and the agent, not the app's services.
 */
export function mountToolView<T>(
  surface: string,
  {
    decode,
    preview,
    render,
  }: {
    decode: (result: ToolResult) => T
    /** Development fixtures for `?preview=…`. Gate on `import.meta.env.DEV` so builds drop them. */
    preview?: (name: string) => Promise<ToolViewSession<T>>
    render: (session: ToolViewSession<T>) => ReactNode
  }
) {
  mount<ToolViewSession<T>>({
    connect: (handlers) => connectToolView({ surface, decode, ...handlers }),
    preview,
    render: (session) => render(session),
  })
}

function mount<S>({
  connect,
  preview: loadPreview,
  render,
}: {
  connect: (handlers: MountHandlers<S>) => Promise<() => void>
  preview?: (name: string) => Promise<S>
  render: (session: S, routing: Omit<SurfaceRenderProps, 'initial'>) => ReactNode
}) {
  const root = createRoot(document.getElementById('root')!)
  let route = '/'
  let notifyRoute: ((path: string) => void) | undefined
  let isDisposed = false
  const registerRoute = (onRoute: (path: string) => void) => {
    notifyRoute = onRoute
  }

  function show(session: S) {
    if (isDisposed) return
    root.render(
      <StrictMode>
        <TooltipProvider>{render(session, { initialRoute: route, registerRoute })}</TooltipProvider>
      </StrictMode>
    )
  }
  function fail(error: Error) {
    if (isDisposed) return
    root.render(
      <Status title="Unable to open Supabase">
        <p role="alert" className="max-w-sm text-sm text-foreground-light">
          {error.message}
        </p>
        <Button variant="default" size="tiny" onClick={() => location.reload()}>
          Retry
        </Button>
      </Status>
    )
  }
  function unmount() {
    if (isDisposed) return
    isDisposed = true
    notifyRoute = undefined
    root.unmount()
  }

  root.render(<Status title="Connecting to Supabase…" />)

  const preview = new URLSearchParams(location.search).get('preview')
  if (import.meta.env.DEV && preview && loadPreview) {
    const previewRoute = new URLSearchParams(location.search).get('route')
    if (previewRoute) route = previewRoute
    void loadPreview(preview).then(show, fail)
    return
  }

  let disconnect: (() => void) | undefined
  const dispose = () => {
    disconnect?.()
    unmount()
  }
  window.addEventListener('pagehide', dispose, { once: true })
  connect({
    onReady: show,
    onError: fail,
    onRoute: (path) => {
      route = path
      notifyRoute?.(path)
    },
    onTeardown: unmount,
  })
    .then((cleanup) => {
      disconnect = cleanup
      if (isDisposed) cleanup()
    })
    .catch(fail)
}
