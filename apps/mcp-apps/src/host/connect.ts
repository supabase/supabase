import { App } from '@modelcontextprotocol/ext-apps'
import { OpenAIExtensions } from '@openai/mcp-extensions/app'
import { CodeMirrorSqlEditor } from 'surfaces/codemirror'
import type { ContextAttachment } from 'surfaces/common'
import {
  PANEL_META_KEY,
  panelBootstrapSchema,
  type DataPort,
  type PanelBootstrap,
} from 'surfaces/contract'

import type { AgentHost, AppServices } from './app-context'
import { createModelContext } from './model-context'
import { applyHostFontCss, applyHostVariables, applyTheme } from './theme-bridge'
import { createToolDataPort, decodeToolResult, type ToolResult } from './tool-data-port'
import { registerWorkspaceTools, type WorkspaceConnection } from './workspace-tools'

/** Everything a surface entry needs once the host has delivered its first result. */
export interface HostSession {
  initial: PanelBootstrap
  services: AppServices
}

export interface ConnectOptions {
  surface: string
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
  surface: string
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

/**
 * Connects one surface to its MCP Apps host and builds its ports.
 *
 * Data goes through `app.callServerTool`, so the host attaches the user's
 * credentials and the server applies its own scope and policy; the document
 * holds no token. Host-specific extensions (OpenAI's message, model context and
 * deep links) are used only when the host advertises them, with the MCP Apps
 * standard as the fallback.
 */
export async function connectToolView<T>({
  surface,
  decode,
  scopedProjectId = () => null,
  workspaceTools = false,
  onReady,
  onError,
  onRoute,
  onTeardown = () => {},
}: ToolViewOptions<T>): Promise<() => void> {
  if (window.parent === window)
    throw new Error('Open Supabase from your agent. This page needs an authenticated MCP host.')

  const app = new App(
    { name: `Supabase ${surface}`, version: '0.0.0' },
    { tools: {}, availableDisplayModes: ['inline', 'fullscreen'] }
  )
  const extensions = new OpenAIExtensions(app)
  let disposed = false

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
    // Known once the initial result arrives; data is only read after that.
    { scopedProjectId: () => (initial ? scopedProjectId(initial.value) : null) }
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
    await app.sendMessage({
      role: 'user',
      content: [
        { type: 'text', text },
        ...attachmentBlocks.map(({ type, text }) => ({ type, text })),
      ],
    })
  }

  const host: AgentHost = {
    agentName: 'agent',
    async expand() {
      ensureOpen()
      const result = await app.requestDisplayMode({ mode: 'fullscreen' })
      if (result.mode !== 'fullscreen')
        throw new Error('This host could not expand the view. You can keep working here.')
    },
    openLink(url) {
      void app.openLink({ url }).catch(() => {})
    },
  }

  // Boxed, because a view's result may itself be falsy.
  let initial: { value: T } | undefined
  let connected = false
  const timeout = window.setTimeout(() => {
    dispose(false)
    onError(
      new Error(
        'Supabase did not receive its initial data. Reopen it after checking the MCP connection.'
      )
    )
  }, 20000)

  function ready() {
    if (disposed || !connected || !initial) return
    window.clearTimeout(timeout)
    onReady({ initial: initial.value, data, agent: host, workspace })
  }

  const receiveResult: NonNullable<App['ontoolresult']> = (result) => {
    if (disposed) return
    try {
      initial = { value: decode(result) }
      ready()
    } catch (error) {
      dispose(false)
      onError(error instanceof Error ? error : new Error('Invalid project data.'))
    }
  }
  const cancelled = () => {
    if (disposed) return
    dispose(false)
    onError(new Error('Opening Supabase was cancelled. Reopen it to try again.'))
  }

  let lastPath: string | undefined
  function applyContext(update?: Record<string, unknown>) {
    if (disposed) return
    const ctx = app.getHostContext()
    applyTheme(ctx?.theme)
    if (ctx?.displayMode) document.documentElement.dataset.displayMode = ctx.displayMode
    applyHostVariables(ctx?.styles?.variables)
    applyHostFontCss(ctx?.styles?.css?.fonts)
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
    window.clearTimeout(timeout)
    modelContext.dispose()
    workspace?.dispose()
    app.removeEventListener('toolresult', receiveResult)
    app.removeEventListener('toolcancelled', cancelled)
    app.removeEventListener('hostcontextchanged', applyContext)
    if (notify) onTeardown()
    // Let the host receive the teardown acknowledgement before closing transport.
    window.setTimeout(() => void app.close().catch(() => {}), 0)
  }

  app.addEventListener('toolresult', receiveResult)
  app.addEventListener('toolcancelled', cancelled)
  app.addEventListener('hostcontextchanged', applyContext)
  app.onteardown = async () => {
    dispose()
    return {}
  }

  try {
    await app.connect()
    if (disposed) return () => dispose()
    connected = true
    host.agentName = agentNameFor(app.getHostVersion()?.name)
    const capabilities = app.getHostCapabilities()
    if (extensions.message || capabilities?.message) host.ask = ask
    if (extensions.modelContext || capabilities?.updateModelContext) host.context = modelContext
    applyContext()
    ready()
  } catch (error) {
    if (disposed) return () => dispose()
    dispose(false)
    throw error
  }
  return () => dispose()
}
