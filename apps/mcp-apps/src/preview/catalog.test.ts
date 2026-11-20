import { McpUiResourceMetaSchema, McpUiToolMetaSchema } from '@modelcontextprotocol/ext-apps'
import {
  OpenAIUiResourceMetadataSchema,
  OpenAIUiToolMetadataSchema,
} from '@openai/mcp-extensions/server'
import { SURFACE_NAMES, surfaceResources } from 'surfaces/contract'
import { describe, expect, it } from 'vitest'

import { CATALOG, resourceMeta } from './catalog'

/**
 * The `_meta` a server sends is read by two hosts with their own keys. These
 * hold it to each host's own schema, so a change for one can't break the other.
 */
describe('tool and resource metadata, for Claude and ChatGPT', () => {
  const uses = CATALOG.flatMap((entry) => entry.uses)

  it.each(uses.map((use) => [use.tool, use] as const))(
    '%s points both hosts at its surface',
    (_tool, use) => {
      const meta = use.toolMeta as Record<string, unknown>
      const { uri, preferredDisplayMode } = surfaceResources[use.surface]

      // MCP Apps, which Claude and ChatGPT read; and the flat key older hosts read.
      expect(McpUiToolMetaSchema.parse(meta.ui)).toMatchObject({ resourceUri: uri })
      expect(meta['ui/resourceUri']).toBe(uri)

      // OpenAI's own keys: strict, so a key it does not define fails here.
      expect(OpenAIUiToolMetadataSchema.parse(meta['openai/ui'])).toMatchObject({
        preferredModelDisplayMode: preferredDisplayMode,
      })
    }
  )

  it('lets Claude list the entry point: visible to the model, with a global entrypoint', () => {
    const entry = uses.find((use) => use.toolKind === 'entrypoint')!
    const meta = entry.toolMeta as { ui: { visibility: string[] }; 'openai/ui': unknown }
    expect(meta.ui.visibility).toContain('model')
    expect(OpenAIUiToolMetadataSchema.parse(meta['openai/ui']).entrypoints).toEqual([
      { type: 'global' },
    ])
  })

  it.each(SURFACE_NAMES)('%s tells both hosts how to show it', (surface) => {
    const meta = resourceMeta(surface)
    const { preferredDisplayMode, displayModes } = surfaceResources[surface]

    // MCP Apps: borderless, and nothing loaded but the host's fonts.
    expect(McpUiResourceMetaSchema.parse(meta.ui)).toMatchObject({
      prefersBorder: false,
      csp: { connectDomains: [], resourceDomains: ['https://assets.claude.ai'] },
    })
    // Claude's extension: `fullscreen` opens the view in its side panel without a click.
    expect(meta.ui.preferredDisplayMode).toBe(preferredDisplayMode)
    // ChatGPT reads the same from its own key.
    expect(OpenAIUiResourceMetadataSchema.parse(meta['openai/ui'])).toEqual({
      preferredDisplayMode,
      availableDisplayModes: [...displayModes],
    })
  })

  it('asks for the clipboard only where a view copies', () => {
    const permissions = (surface: (typeof SURFACE_NAMES)[number]) =>
      (resourceMeta(surface).ui as { permissions?: unknown }).permissions
    expect(permissions('project-card')).toEqual({ clipboardWrite: {} })
    expect(permissions('branch-card')).toEqual({ clipboardWrite: {} })
    expect(permissions('panel')).toBeUndefined()
  })
})
