import yaml from 'js-yaml'
import { parse as parseToml } from 'smol-toml'
import { describe, expect, it } from 'vitest'

import type { McpClientConfig } from '../types'
import { serializeMcpConfig } from './serializeMcpConfig'

const config = {
  servers: {
    supabase: {
      type: 'http',
      url: 'https://mcp.supabase.com/mcp?project_ref=abc',
    },
  },
} as const satisfies McpClientConfig

describe('serializeMcpConfig', () => {
  it('serializes to pretty-printed JSON when no config file is given', () => {
    expect(serializeMcpConfig(undefined, config)).toEqual({
      lang: 'json',
      value: JSON.stringify(config, null, 2),
    })
  })

  it('serializes to JSON for a .json config file', () => {
    expect(serializeMcpConfig('mcp.json', config).lang).toBe('json')
  })

  it.each(['config.yaml', 'config.yml'])('serializes to YAML for %s', (configFile) => {
    const result = serializeMcpConfig(configFile, config)

    expect(result.lang).toBe('yaml')
    expect(yaml.load(result.value)).toEqual(config)
  })

  it('serializes to TOML for a .toml config file', () => {
    const result = serializeMcpConfig('config.toml', config)

    expect(result.lang).toBe('toml')
    expect(parseToml(result.value)).toEqual(config)
  })

  it('matches the file extension case-insensitively', () => {
    expect(serializeMcpConfig('CONFIG.YAML', config).lang).toBe('yaml')
    expect(serializeMcpConfig('Config.TOML', config).lang).toBe('toml')
  })

  it('falls back to JSON for an unrecognized extension or no extension', () => {
    expect(serializeMcpConfig('config.txt', config).lang).toBe('json')
    expect(serializeMcpConfig('config', config).lang).toBe('json')
  })
})
