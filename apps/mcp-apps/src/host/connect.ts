import { App } from '@modelcontextprotocol/ext-apps'
import { OpenAIExtensions } from '@openai/mcp-extensions/app'
import { CodeMirrorSqlEditor } from 'surfaces/codemirror'
import { errorMessage, type ContextAttachment } from 'surfaces/common'
import {
  PANEL_META_KEY,
  panelBootstrapSchema,
  surfaceResources,
  type DataPort,
  type PanelBootstrap,
  type SurfaceName,
} from 'surfaces/contract'

import type { AgentHost, AppServices } from './app-context'
import { claudeMessageBlocks } from './message-limits'
import { createModelContext } from './model-context'
import {
  applyHostFontCss,
  applyHostVariables,
  applySafeAreaInsets,
  applyTheme,
} from './theme-bridge'
import { createToolCallStore, type ToolCallSnapshot, type ToolCallStore } from './tool-call-store'
import { createToolDataPort, decodeToolResult, type ToolResult } from './tool-data-port'
import { registerWorkspaceTools, type WorkspaceConnection } from './workspace-tools'

/** Everything a surface entry needs once the host has delivered its first result. */
export interface HostSession {
  initial: PanelBootstrap
  services: AppServices
}

export interface ConnectOptions {
  surface: SurfaceName
  onReady: (session: HostSession) => void
  onError: (error: Error) => void
  /** Deep links such as `/projects/<ref>?schema=public&table=todos`. */
  onRoute?: (path: string) => void
  onTeardown?: () => void
}

/** A view of one tool result: what it decoded, plus ports for further reads and the agent. */
export interface ToolViewSession<T> {
  initial: T
  data: DataPort
  agent: AgentHost
  workspace?: WorkspaceConnection
}

export interface ToolViewOptions<T> {
  surface: SurfaceName
  /** Reads the tool result this view renders. Throw to show an error instead. */
  decode: (result: ToolResult) => T
  /** The project a scoped connection is locked to, once the result is known. */
  scopedProjectId?: (initial: T) => string | null
  /** Registers the workspace tools the agent uses to drive a mounted workspace. */
  workspaceTools?: boolean
  onReady: (session: ToolViewSession<T>) => void
  onError: (error: Error) => void
  /** Deep links such as `/projects/<ref>?schema=public&table=todos`. */
  onRoute?: (path: string) => void
  onTeardown?: () => void
}

export type { ToolCallSnapshot, ToolCallStore }

/** A view of a tool call in progress, e.g. the project card on `create_project`. */
export interface ToolCallSession<T> {
  toolCall: ToolCallStore<T>
  data: DataPort
  agent: AgentHost
  /** How often the view reads the status again. Development previews shorten it. */
  pollIntervalMs?: number
}

export interface ToolCallOptions<T> {
  surface: SurfaceName
  /** Reads the tool result. Throw to show the call as failed, with the error's message. */
  decode: (result: ToolResult) => T
  /** The project a scoped connection is locked to, from what is known of the call so far. */
  scopedProjectId?: (snapshot: ToolCallSnapshot<T>) => string | null
  /** Called once, straight away: the view renders while the host connects and the tool runs. */
  onReady: (session: ToolCallSession<T>) => void
  onTeardown?: () => void
}

/** Names the agent in action labels without guessing from unknown hosts. */
function agentNameFor(hostName: string | undefined) {
  const name = hostName?.toLowerCase() ?? ''
  if (name.includes('codex')) return 'Codex'
  if (name.includes('chatgpt') || name.includes('openai')) return 'ChatGPT'
  if (name.includes('claude')) return 'Claude'
  return 'agent'
}

/** Panel and workspace surfaces receive the connection bootstrap, plus a panel launch. */
export function decodePanelBootstrap(result: ToolResult): PanelBootstrap {
  // Panel payloads stay out of model-visible output; check errors first.
  const payload = decodeToolResult(result)
  const initial = panelBootstrapSchema.parse(
    (result as { _meta?: Record<string, unknown> })._meta?.[PANEL_META_KEY] ?? payload
  )
  if (initial.panel && !initial.projects.some((p) => p.id === initial.panel!.project_id))
    throw new Error('This project is unavailable on this connection.')
  return initial
}

/** Connects a panel or workspace surface, with the services its screens read. */
export function connectToHost({ onReady, ...options }: ConnectOptions): Promise<() => void> {
  return connectToolView({
    ...options,
    decode: decodePanelBootstrap,
    scopedProjectId: (initial) => initial.capabilities.scopedProjectId,
    workspaceTools: true,
    onReady: ({ initial, data, agent, workspace }) =>
      onReady({
        initial,
        services: {
          data,
          agent,
          SqlEditor: CodeMirrorSqlEditor,
          capabilities: initial.capabilities,
          workspace,
        },
      }),
  })
}

const NO_HOST = 'Open Supabase from your agent. This page needs an authenticated MCP host.'

/**
 * One surface's connection to its MCP Apps host, and the ports built on it.
 *
 * Data goes through `app.callServerTool`, so the host attaches the user's
 * credentials and the server applies its own scope and policy; the document
 * holds no token. Host-specific extensions (OpenAI's message, model context and
 * deep links) are used only when the host advertises them, with the MCP Apps
 * standard as the fallback.
 */
function createConnection({
  surface,
  scopedProjectId,
  workspaceTools = false,
  onRoute,
  onTeardown = () => {},
}: {
  surface: SurfaceName
  scopedProjectId: () => string | null
  workspaceTools?: boolean
  onRoute?: (path: string) => void
  onTeardown?: () => void
}) {
  // What the surface declares to the host is what the contract says of it. In Claude, a view
  // that lists fullscreen gets an expand button above it, and one that lists only fullscreen
  // opens from a card into the side panel; a card that lists only inline stays in the
  // conversation with no expand button. Only surfaces with app tools declare the capability.
  const displayModes: readonly ('inline' | 'fullscreen')[] = surfaceResources[surface].displayModes
  const app = new App(
    { name: `Supabase ${surface}`, version: '0.0.0' },
    { ...(workspaceTools ? { tools: {} } : {}), availableDisplayModes: [...displayModes] }
  )
  const extensions = new OpenAIExtensions(app)
  let disposed = false
  const cleanups: (() => void)[] = []

  const modelContext = createModelContext(() => {
    if (extensions.modelContext) return extensions.modelContext
    if (app.getHostCapabilities()?.updateModelContext)
      return {
        update: (params: Parameters<App['updateModelContext']>[0]) =>
          app.updateModelContext(params),
        getCurrent: () => undefined,
      } as unknown as NonNullable<typeof extensions.modelContext>
    return undefined
  })
  const workspace = workspaceTools ? registerWorkspaceTools(app) : undefined

  const ensureOpen = () => {
    if (disposed) throw new Error('This view has closed.')
  }
  const data = createToolDataPort(
    async (name, args) => {
      ensureOpen()
      return app.callServerTool({ name, arguments: args })
    },
    { scopedProjectId }
  )

  async function ask(text: string, attachment?: ContextAttachment) {
    ensureOpen()
    const attachmentBlocks = attachment
      ? [
          {
            type: 'text' as const,
            text: attachment.text,
            _meta: { 'openai/title': attachment.title },
          },
        ]
      : []
    if (extensions.message) {
      await extensions.message.send({
        role: 'user',
        content: [{ type: 'text', text }, ...attachmentBlocks],
        _meta: { 'openai/message': { target: 'active', send: true } },
      })
      return
    }
    const texts = [text, ...attachmentBlocks.map((block) => block.text)]
    // Claude refuses messages past its limits; other hosts on the standard take them as they are.
    const blocks = host.agentName === 'Claude' ? claudeMessageBlocks(texts) : texts
    const result = await app.sendMessage({
      role: 'user',
      content: blocks.map((block) => ({ type: 'text' as const, text: block })),
    })
    // No error only means the host took the message: the user may still be asked to allow it.
    if (result.isError)
      throw new Error(`${host.agentName} didn’t take the message. Try again from the chat.`)
  }

  async function expand() {
    ensureOpen()
    const result = await app.requestDisplayMode({ mode: 'fullscreen' })
    if (result.mode !== 'fullscreen')
      throw new Error('This host could not expand the view. You can keep working here.')
  }

  const host: AgentHost = {
    agentName: 'agent',
    openLink(url) {
      void app.openLink({ url }).catch(() => {})
    },
  }

  let lastPath: string | undefined
  function applyContext(update?: Record<string, unknown>) {
    if (disposed) return
    const ctx = app.getHostContext()
    applyTheme(ctx?.theme)
    if (ctx?.displayMode) document.documentElement.dataset.displayMode = ctx.displayMode
    applyHostVariables(ctx?.styles?.variables)
    applyHostFontCss(ctx?.styles?.css?.fonts)
    applySafeAreaInsets(ctx?.safeAreaInsets)
    if (!update || 'openai/modelContext' in update)
      modelContext.receive(extensions.modelContext?.getCurrent())
    const path = extensions.deepLink.getCurrent()?.url
    if (path && (path !== lastPath || (update && 'openai/deepLink' in update))) {
      lastPath = path
      onRoute?.(path)
    }
  }

  function dispose(notify = true) {
    if (disposed) return
    disposed = true
    for (const cleanup of cleanups) cleanup()
    modelContext.dispose()
    workspace?.dispose()
    app.removeEventListener('hostcontextchanged', applyContext)
    if (notify) onTeardown()
    // Let the host receive the teardown acknowledgement before closing transport.
    window.setTimeout(() => void app.close().catch(() => {}), 0)
  }

  app.addEventListener('hostcontextchanged', applyContext)
  app.onteardown = async () => {
    dispose()
    return {}
  }

  return {
    app,
    data,
    host,
    workspace,
    isDisposed: () => disposed,
    /** Runs when the connection closes, however it closes. */
    onDispose(cleanup: () => void) {
      cleanups.push(cleanup)
    },
    dispose,
    /**
     * Completes the handshake and applies the host's context. Resolves false if
     * the connection closed meanwhile; a failed handshake closes it and throws.
     */
    async open() {
      try {
        await app.connect()
        if (disposed) return false
        host.agentName = agentNameFor(app.getHostVersion()?.name)
        const capabilities = app.getHostCapabilities()
        // Offered only where it can work: the surface supports fullscreen and the host has not
        // said it can't (Claude lists only inline where views can't leave the conversation).
        const offered = app.getHostContext()?.availableDisplayModes
        if (displayModes.includes('fullscreen') && (!offered || offered.includes('fullscreen')))
          host.expand = expand
        if (extensions.message || capabilities?.message) host.ask = ask
        if (extensions.modelContext || capabilities?.updateModelContext) host.context = modelContext
        applyContext()
        return true
      } catch (error) {
        if (disposed) return false
        dispose(false)
        throw error
      }
    },
  }
}

/**
 * Connects a view of one tool result: it is ready once the host has connected
 * and delivered the result. A result that can't be read, a cancelled call or
 * no result in time is an error, since the view has nothing to show.
 */
export async function connectToolView<T>({
  surface,
  decode,
  scopedProjectId = () => null,
  workspaceTools = false,
  onReady,
  onError,
  onRoute,
  onTeardown,
}: ToolViewOptions<T>): Promise<() => void> {
  if (window.parent === window) throw new Error(NO_HOST)

  // Boxed, because a view's result may itself be falsy.
  let initial: { value: T } | undefined
  let connected = false
  const connection = createConnection({
    surface,
    workspaceTools,
    onRoute,
    onTeardown,
    // Known once the initial result arrives; data is only read after that.
    scopedProjectId: () => (initial ? scopedProjectId(initial.value) : null),
  })
  const { app } = connection

  const timeout = window.setTimeout(() => {
    connection.dispose(false)
    onError(
      new Error(
        'Supabase did not receive its initial data. Reopen it after checking the MCP connection.'
      )
    )
  }, 20000)

  function ready() {
    if (connection.isDisposed() || !connected || !initial) return
    window.clearTimeout(timeout)
    onReady({
      initial: initial.value,
      data: connection.data,
      agent: connection.host,
      workspace: connection.workspace,
    })
  }

  const receiveResult: NonNullable<App['ontoolresult']> = (result) => {
    if (connection.isDisposed()) return
    try {
      initial = { value: decode(result) }
      ready()
    } catch (error) {
      connection.dispose(false)
      onError(error instanceof Error ? error : new Error('Invalid project data.'))
    }
  }
  const cancelled = () => {
    if (connection.isDisposed()) return
    connection.dispose(false)
    onError(new Error('Opening Supabase was cancelled. Reopen it to try again.'))
  }

  app.addEventListener('toolresult', receiveResult)
  app.addEventListener('toolcancelled', cancelled)
  connection.onDispose(() => {
    window.clearTimeout(timeout)
    app.removeEventListener('toolresult', receiveResult)
    app.removeEventListener('toolcancelled', cancelled)
  })

  if (await connection.open()) {
    connected = true
    ready()
  }
  return () => connection.dispose()
}

/**
 * Connects a view of a tool call in progress, such as the project card on
 * `create_project`. Unlike `connectToolView`, the view is shown straight
 * away, so the host can size the frame, and it keeps the call's whole story:
 * its arguments while the host waits on the user or the tool runs, then its
 * result, an error or a cancellation. None of those close the view, and
 * nothing times out: a host may wait on the user for as long as it likes.
 */
export async function connectToolCall<T>({
  surface,
  decode,
  scopedProjectId = () => null,
  onReady,
  onTeardown,
}: ToolCallOptions<T>): Promise<() => void> {
  if (window.parent === window) throw new Error(NO_HOST)

  const { store, update: change } = createToolCallStore<T>()
  function update(next: Partial<ToolCallSnapshot<T>>) {
    if (!connection.isDisposed()) change(next)
  }

  const connection = createConnection({
    surface,
    onTeardown,
    scopedProjectId: () => scopedProjectId(store.getSnapshot()),
  })
  const { app } = connection

  const receiveInput: NonNullable<App['ontoolinput']> = ({ arguments: input }) => update({ input })
  const receiveResult: NonNullable<App['ontoolresult']> = (result) => {
    try {
      update({ call: { status: 'ready', data: decode(result) } })
    } catch (error) {
      update({ call: { status: 'error', message: errorMessage(error) } })
    }
  }
  // Without this, a call cancelled by the user or host would leave the view loading forever.
  const cancelled: NonNullable<App['ontoolcancelled']> = ({ reason }) =>
    update({ call: { status: 'cancelled', reason } })

  app.addEventListener('toolinput', receiveInput)
  app.addEventListener('toolresult', receiveResult)
  app.addEventListener('toolcancelled', cancelled)
  connection.onDispose(() => {
    app.removeEventListener('toolinput', receiveInput)
    app.removeEventListener('toolresult', receiveResult)
    app.removeEventListener('toolcancelled', cancelled)
  })

  onReady({ toolCall: store, data: connection.data, agent: connection.host })

  try {
    if (await connection.open()) {
      const capabilities = app.getHostCapabilities()
      update({
        isConnected: true,
        canCallTools: !!capabilities?.serverTools,
        canOpenLinks: !!capabilities?.openLinks,
      })
    }
  } catch (error) {
    // No result can arrive now; the view says so in place.
    change({ call: { status: 'error', message: errorMessage(error) } })
  }
  return () => connection.dispose()
}
