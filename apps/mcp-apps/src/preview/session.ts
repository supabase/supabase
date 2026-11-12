import { CodeMirrorSqlEditor } from 'surfaces/codemirror'

import type { AgentHost } from '../host/app-context'
import type { HostSession } from '../host/connect'
import { createPreviewDataPort, PREVIEW_PANELS, previewBootstrap, previewPanel } from './fixtures'

/** A host-free session for `?preview=` URLs in `pnpm dev`. Agent actions are inert. */
export function createPreviewSession(surface: string, preview: string): HostSession {
  const agent: AgentHost = {
    agentName: 'agent',
    isPreview: true,
    openLink: (url) => window.open(url, '_blank', 'noopener'),
  }
  const initial =
    surface === 'projects'
      ? previewBootstrap
      : previewPanel(PREVIEW_PANELS.find((view) => view === preview) ?? 'sql')
  return {
    initial,
    services: {
      data: createPreviewDataPort(),
      agent,
      SqlEditor: CodeMirrorSqlEditor,
      capabilities: initial.capabilities,
    },
  }
}
