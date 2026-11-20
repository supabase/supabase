import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { connectToHost, connectToolCall, type HostSession, type ToolCallSession } from './connect'

/** A stand-in for the MCP Apps SDK's `App`: records what each surface declares and sends. */
const host = vi.hoisted(() => ({
  apps: [] as { capabilities: Record<string, unknown>; listeners: Map<string, Function> }[],
  name: 'Claude',
  capabilities: { message: {}, serverTools: {}, openLinks: {} } as Record<string, unknown>,
  context: {} as Record<string, unknown>,
  sendMessage: vi.fn(async (): Promise<{ isError?: boolean }> => ({})),
  requestDisplayMode: vi.fn(async () => ({ mode: 'fullscreen' })),
}))

vi.mock('@modelcontextprotocol/ext-apps', () => ({
  App: class {
    listeners = new Map<string, Function>()
    constructor(
      _info: unknown,
      public capabilities: Record<string, unknown>
    ) {
      host.apps.push(this)
    }
    addEventListener(name: string, listener: Function) {
      this.listeners.set(name, listener)
    }
    removeEventListener() {}
    registerTool() {}
    connect = async () => {}
    close = async () => {}
    getHostVersion = () => ({ name: host.name })
    getHostCapabilities = () => host.capabilities
    getHostContext = () => host.context
    sendMessage = host.sendMessage
    requestDisplayMode = host.requestDisplayMode
    openLink = async () => ({})
  },
}))
vi.mock('@openai/mcp-extensions/app', () => ({
  OpenAIExtensions: class {
    deepLink = { getCurrent: () => undefined }
  },
}))
vi.mock('surfaces/codemirror', () => ({ CodeMirrorSqlEditor: () => null }))

const bootstrap = {
  projects: [],
  organizations: [],
  regions: [],
  capabilities: {
    readOnly: true,
    database: true,
    createProject: false,
    creationMode: 'legacy',
    scopedProjectId: null,
  },
}

/** Connects a panel-like surface and delivers its bootstrap, as a host does. */
async function openSurface(surface: 'panel' | 'query-block' | 'projects') {
  let session: HostSession | undefined
  const connecting = connectToHost({
    surface,
    onReady: (ready) => (session = ready),
    onError: (error) => {
      throw error
    },
  })
  host.apps.at(-1)!.listeners.get('toolresult')!({ structuredContent: bootstrap })
  await connecting
  return session!
}

beforeEach(() => {
  // Surfaces refuse to run outside a host's frame.
  vi.stubGlobal('parent', {})
  host.apps.length = 0
  host.name = 'Claude'
  host.context = {}
  host.sendMessage.mockReset().mockResolvedValue({})
  host.requestDisplayMode.mockClear()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('what a surface declares to its host', () => {
  it('keeps a card in the conversation: inline only, and no app tools', async () => {
    let session: ToolCallSession<unknown> | undefined
    await connectToolCall({
      surface: 'project-card',
      decode: () => ({}),
      onReady: (ready) => (session = ready),
    })
    // Claude shows an expand button above any view that lists fullscreen.
    expect(host.apps[0]!.capabilities).toEqual({ availableDisplayModes: ['inline'] })
    expect(session!.agent.expand).toBeUndefined()
    expect(session!.toolCall.getSnapshot()).toMatchObject({
      isConnected: true,
      canCallTools: true,
      canOpenLinks: true,
    })
  })

  it('opens a panel beside the conversation: fullscreen only, with its app tools', async () => {
    await openSurface('panel')
    expect(host.apps[0]!.capabilities).toEqual({
      tools: {},
      availableDisplayModes: ['fullscreen'],
    })
  })

  it('lets an inline query block expand, from a click, where the host offers fullscreen', async () => {
    host.context = { availableDisplayModes: ['inline', 'fullscreen'] }
    const { services } = await openSurface('query-block')
    expect(host.apps[0]!.capabilities.availableDisplayModes).toEqual(['inline', 'fullscreen'])
    await services.agent.expand!()
    expect(host.requestDisplayMode).toHaveBeenCalledWith({ mode: 'fullscreen' })
  })

  it('offers no expand where views cannot leave the conversation', async () => {
    host.context = { availableDisplayModes: ['inline'] }
    const { services } = await openSurface('query-block')
    expect(services.agent.expand).toBeUndefined()
  })
})

describe('messages a surface sends to the agent', () => {
  it('sends Claude text blocks it accepts', async () => {
    const { services } = await openSurface('panel')
    await services.agent.ask!('Investigate these logs', {
      projectId: 'ref',
      title: 'Selected logs',
      text: `error${' '.repeat(200)}timeout`,
    })
    expect(host.sendMessage).toHaveBeenCalledWith({
      role: 'user',
      content: [
        { type: 'text', text: 'Investigate these logs' },
        { type: 'text', text: `error${' '.repeat(64)}timeout` },
      ],
    })
  })

  it('says so when the host did not take the message', async () => {
    host.sendMessage.mockResolvedValue({ isError: true })
    const { services } = await openSurface('panel')
    await expect(services.agent.ask!('Investigate these logs')).rejects.toThrow(
      'Claude didn’t take the message. Try again from the chat.'
    )
  })

  it('asks for less rather than send Claude a message it would refuse', async () => {
    const { services } = await openSurface('panel')
    const attachment = { projectId: 'ref', title: 'Selected logs', text: 'x'.repeat(9000) }
    await expect(services.agent.ask!('Investigate these logs', attachment)).rejects.toThrow(
      'Select less to send.'
    )
    expect(host.sendMessage).not.toHaveBeenCalled()
  })

  it('leaves other hosts’ messages as they are', async () => {
    host.name = 'Some other host'
    const { services } = await openSurface('panel')
    const attachment = { projectId: 'ref', title: 'Selected logs', text: 'x'.repeat(9000) }
    await services.agent.ask!('Investigate these logs', attachment)
    expect(host.sendMessage).toHaveBeenCalled()
  })
})
