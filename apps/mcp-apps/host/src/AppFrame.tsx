import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge'
import { useEffect, useRef, useState } from 'react'

import { isAppVisible, mcp, type CallToolResult, type Tool } from './api'
import { withCsp, type ResourceCsp } from './csp'
import { hostVariables, type HostProfile, type Theme } from './host-profiles'

export type DisplayMode = 'inline' | 'fullscreen'

export interface View {
  id: string
  tool: Tool
  input: Record<string, unknown>
  result: CallToolResult
  resourceUri: string
}

/** What the host keeps for a mounted view: its tools and its latest model context. */
export interface MountedView {
  listTools(): Promise<Tool[]>
  callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult>
}

export interface AppFrameProps {
  view: View
  mode: DisplayMode
  availableModes: DisplayMode[]
  theme: Theme
  profile: HostProfile
  serverTools: () => Tool[]
  onMessage: (text: string) => void
  onModelContext: (viewId: string, text: string | undefined) => void
  onRequestMode: (viewId: string, mode: DisplayMode) => DisplayMode
  onMount: (viewId: string, view: MountedView | undefined) => void
}

const HOST_CAPABILITIES = {
  openLinks: {},
  downloadFile: {},
  serverTools: {},
  serverResources: {},
  logging: {},
  updateModelContext: { text: {} },
  message: { text: {} },
}

function hostContext(
  props: Pick<AppFrameProps, 'theme' | 'profile' | 'mode' | 'availableModes' | 'view'>,
  size?: { width: number; height: number }
) {
  const variables = hostVariables(props.profile, props.theme)
  return {
    theme: props.theme,
    displayMode: props.mode,
    availableDisplayModes: props.availableModes,
    platform: 'web' as const,
    locale: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: 'supabase-mcp-apps-dev-host',
    toolInfo: { tool: props.view.tool },
    // Hosts may send any subset of the standard variables.
    ...(variables && { styles: { variables: variables as never } }),
    ...(size &&
      (props.mode === 'inline'
        ? { containerDimensions: { width: size.width, maxHeight: 640 } }
        : { containerDimensions: { width: size.width, height: size.height } })),
  }
}

function textOf(content: { type: string; text?: string }[] | undefined) {
  return content
    ?.filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
}

/**
 * Renders one view the way an MCP Apps host does: its `ui://` document in a
 * sandboxed, opaque-origin frame under the resource's CSP, connected over
 * postMessage. Tool calls from the view go to the MCP server only when the
 * server marked the tool visible to apps.
 */
export function AppFrame(props: AppFrameProps) {
  const { view, mode } = props
  const container = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const bridge = useRef<AppBridge | undefined>(undefined)
  const latest = useRef(props)
  latest.current = props
  const [height, setHeight] = useState(mode === 'inline' ? 360 : undefined)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const iframe = frame.current
    if (!iframe?.contentWindow) return
    let closed = false
    const size = () => {
      const rect = container.current?.getBoundingClientRect()
      return rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : undefined
    }
    const app = new AppBridge(
      null,
      { name: 'Supabase MCP Apps dev host', version: '0.0.0' },
      HOST_CAPABILITIES,
      {
        hostContext: hostContext(latest.current, size()),
      }
    )
    bridge.current = app

    app.oninitialized = async () => {
      await app.sendToolInput({ arguments: view.input })
      await app.sendToolResult(view.result)
      latest.current.onMount(view.id, {
        async listTools() {
          if (!app.getAppCapabilities()?.tools) return []
          return (await app.listTools({})).tools as Tool[]
        },
        async callTool(name, args) {
          return (await app.callTool({ name, arguments: args })) as CallToolResult
        },
      })
    }
    app.oncalltool = async ({ name, arguments: args }) => {
      const tool = latest.current.serverTools().find((candidate) => candidate.name === name)
      if (!tool || !isAppVisible(tool))
        return {
          isError: true,
          content: [{ type: 'text', text: `The host does not allow views to call ${name}.` }],
        }
      return (await mcp.callTool(name, args ?? {})) as never
    }
    app.onreadresource = async (params) => (await mcp.request('resources/read', params)) as never
    app.onlistresources = async (params) => (await mcp.request('resources/list', params)) as never
    app.onmessage = async ({ content }) => {
      const text = textOf(content as never)
      if (text) latest.current.onMessage(text)
      return {}
    }
    app.onupdatemodelcontext = async ({ content, structuredContent }) => {
      const text =
        textOf(content as never) ??
        (structuredContent ? JSON.stringify(structuredContent) : undefined)
      latest.current.onModelContext(view.id, text)
      return {}
    }
    app.onopenlink = async ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer')
      return {}
    }
    app.onrequestdisplaymode = async ({ mode: requested }) => ({
      mode: latest.current.onRequestMode(
        view.id,
        requested === 'fullscreen' ? 'fullscreen' : 'inline'
      ),
    })
    app.onsizechange = ({ height: next }) => {
      if (latest.current.mode === 'inline' && next) setHeight(Math.min(Math.ceil(next), 640))
    }
    app.onloggingmessage = ({ level, data }) => console.log(`[view ${view.id}] ${level}`, data)
    app.ondownloadfile = async (params) => {
      console.info('[host] download requested', params)
      return {}
    }

    void (async () => {
      try {
        await app.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!))
        const { contents } = await mcp.readResource(view.resourceUri)
        const content = contents[0] as { text?: string; _meta?: { ui?: { csp?: ResourceCsp } } }
        if (!content?.text) throw new Error(`${view.resourceUri} has no HTML`)
        if (!closed) iframe.srcdoc = withCsp(content.text, content._meta?.ui?.csp)
      } catch (cause) {
        if (!closed) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()

    return () => {
      closed = true
      latest.current.onMount(view.id, undefined)
      latest.current.onModelContext(view.id, undefined)
      void app
        .teardownResource({})
        .catch(() => {})
        .finally(() => app.close())
      bridge.current = undefined
    }
  }, [view])

  // Theme, palette and size changes reach a mounted view as host context updates.
  useEffect(() => {
    const rect = container.current?.getBoundingClientRect()
    void bridge.current?.sendHostContextChange(
      hostContext(props, rect && { width: Math.round(rect.width), height: Math.round(rect.height) })
    )
  }, [props.theme, props.profile, props.mode])

  if (error)
    return (
      <p className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    )

  return (
    <div ref={container} className={mode === 'inline' ? 'w-full' : 'h-full w-full'}>
      <iframe
        ref={frame}
        title={view.tool.title ?? view.tool.name}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="clipboard-write"
        className="block w-full border-0"
        style={mode === 'inline' ? { height } : { height: '100%' }}
      />
    </div>
  )
}
