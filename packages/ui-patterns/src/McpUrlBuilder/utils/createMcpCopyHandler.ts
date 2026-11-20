import type { McpClient, McpOnCopyCallback } from '../types'

export type McpCopyType = McpOnCopyCallback

export interface McpCopyHandlerParams {
  selectedClient: McpClient | null
  source: 'studio' | 'docs'
  onTrack: (event: {
    action: 'connection_string_copied'
    properties: {
      connectionTab: 'MCP'
      selectedItem?: string
      connectionType: string
      source: 'studio' | 'docs'
    }
    groups?: {
      project?: string
      organization?: string
      [key: string]: string | undefined
    }
  }) => void
  projectRef?: string
}

/**
 * Creates a copy handler for MCP configuration copying events.
 * Centralizes the telemetry logic for tracking MCP URL, config, and command copies.
 *
 * @param params - Configuration for the copy handler
 * @returns A function that handles copy events and sends appropriate telemetry
 *
 * @example
 * ```ts
 * const handleCopy = createMcpCopyHandler({
 *   selectedClient,
 *   source: 'studio',
 *   onTrack: track,
 *   projectRef: project?.ref
 * })
 *
 * // Usage in component
 * handleCopy('config') // Tracks copying of config file
 * handleCopy('command') // Tracks copying of command line
 * handleCopy('url') // Tracks copying of MCP URL
 * ```
 */
export function createMcpCopyHandler(params: McpCopyHandlerParams) {
  const { selectedClient, source, onTrack, projectRef } = params

  return (type?: McpCopyType) => {
    let connectionType: string
    switch (type) {
      case 'command':
        connectionType = 'Command Line'
        break
      case 'config':
        connectionType = 'Config File'
        break
      case 'url':
      default:
        connectionType = 'MCP URL'
        break
    }

    onTrack({
      action: 'connection_string_copied',
      properties: {
        connectionTab: 'MCP',
        selectedItem: selectedClient?.label,
        connectionType,
        source,
      },
      ...(projectRef && { groups: { project: projectRef } }),
    })
  }
}
