import yaml from 'js-yaml'
import { stringify as stringifyToml } from 'smol-toml'

import type { McpClientConfig } from '../types'

/**
 * Serializes a client's MCP config to a code-block string, choosing the format
 * (and the fence language) from the config file's extension. Shared by the
 * dashboard's Connect panel and the generated markdown docs so the two never
 * drift.
 */
export function serializeMcpConfig(
  configFile: string | undefined,
  config: McpClientConfig
): { lang: 'json' | 'yaml' | 'toml'; value: string } {
  switch (configFile?.split('.').pop()?.toLowerCase()) {
    case 'yaml':
    case 'yml':
      return { lang: 'yaml', value: yaml.dump(config, { indent: 2, lineWidth: -1 }).trim() }
    case 'toml':
      return {
        lang: 'toml',
        value: stringifyToml(config as unknown as Record<string, unknown>).trim(),
      }
    default:
      return { lang: 'json', value: JSON.stringify(config, null, 2) }
  }
}
