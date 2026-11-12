import type { PanelBootstrap } from '@supabase/mcp-server-supabase/apps'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, TooltipProvider } from 'ui'

import { AppProvider } from '../host/app-context'
import { connectToHost, type HostSession } from '../host/connect'

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

/**
 * Mounts one surface: connects to the host (or, in development with
 * `?preview=…`, to fixtures), then renders inside the surface and shell providers.
 */
export function mountSurface(surface: string, render: (props: SurfaceRenderProps) => ReactNode) {
  const root = createRoot(document.getElementById('root')!)
  let route = '/'
  let notifyRoute: ((path: string) => void) | undefined
  let isDisposed = false
  const registerRoute = (onRoute: (path: string) => void) => {
    notifyRoute = onRoute
  }

  function show(session: HostSession) {
    if (isDisposed) return
    root.render(
      <StrictMode>
        <AppProvider services={session.services}>
          <TooltipProvider>
            {render({ initial: session.initial, initialRoute: route, registerRoute })}
          </TooltipProvider>
        </AppProvider>
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
  if (import.meta.env.DEV && preview) {
    void import('../preview/session').then(({ createPreviewSession }) => {
      const previewRoute = new URLSearchParams(location.search).get('route')
      if (previewRoute) route = previewRoute
      show(createPreviewSession(surface, preview))
    })
    return
  }

  let disconnect: (() => void) | undefined
  const dispose = () => {
    disconnect?.()
    unmount()
  }
  window.addEventListener('pagehide', dispose, { once: true })
  connectToHost({
    surface,
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
