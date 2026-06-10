import { describe, expect, it } from 'vitest'

import { getRegistryAddCommand, getRegistrySearchCommand, getRegistryViewCommand } from './cli'

describe('registry cli commands', () => {
  it('builds add commands from GitHub registry item addresses', () => {
    expect(getRegistryAddCommand('auth')).toBe('npx shadcn@latest add supabase/supabase/auth')
  })

  it('builds view commands from GitHub registry item addresses', () => {
    expect(getRegistryViewCommand('auth')).toBe('npx shadcn@latest view supabase/supabase/auth')
  })

  it('lists registry items when search is empty', () => {
    expect(getRegistrySearchCommand()).toBe('npx shadcn@latest list supabase/supabase')
    expect(getRegistrySearchCommand('   ')).toBe('npx shadcn@latest list supabase/supabase')
  })

  it('searches registry items when a query is provided', () => {
    expect(getRegistrySearchCommand('auth')).toBe(
      'npx shadcn@latest search supabase/supabase -q auth'
    )
    expect(getRegistrySearchCommand('rate limits')).toBe(
      "npx shadcn@latest search supabase/supabase -q 'rate limits'"
    )
  })
})
