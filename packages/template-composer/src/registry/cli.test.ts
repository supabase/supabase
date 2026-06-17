import { describe, expect, it } from 'vitest'

import { getRegistryAddCommand, getRegistrySearchCommand, getRegistryViewCommand } from './cli'

describe('registry cli commands', () => {
  it('builds add commands from GitHub registry item addresses', () => {
    expect(getRegistryAddCommand('auth')).toBe('npx shadcn@latest add SaxonF/templates/auth')
    expect(
      getRegistryAddCommand('auth', {
        registrySlug: 'https://github.com/supabase/templates',
      })
    ).toBe('npx shadcn@latest add supabase/templates/auth')
  })

  it('builds view commands from GitHub registry item addresses', () => {
    expect(getRegistryViewCommand('auth')).toBe('npx shadcn@latest view SaxonF/templates/auth')
  })

  it('lists registry items when search is empty', () => {
    expect(getRegistrySearchCommand()).toBe('npx shadcn@latest list SaxonF/templates')
    expect(getRegistrySearchCommand('   ')).toBe('npx shadcn@latest list SaxonF/templates')
    expect(
      getRegistrySearchCommand('', {
        registrySlug: 'supabase/templates',
      })
    ).toBe('npx shadcn@latest list supabase/templates')
  })

  it('searches registry items when a query is provided', () => {
    expect(getRegistrySearchCommand('auth')).toBe(
      'npx shadcn@latest search SaxonF/templates -q auth'
    )
    expect(getRegistrySearchCommand('rate limits')).toBe(
      "npx shadcn@latest search SaxonF/templates -q 'rate limits'"
    )
  })
})
