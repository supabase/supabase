import { describe, expect, it } from 'vitest'

import {
  getStartTemplateRef,
  getStartTemplateRegistryCommandOptions,
  getStartTemplateRepository,
} from './template-registry-config'

describe('template registry config', () => {
  it('uses the temporary default registry when no env override is set', () => {
    expect(getStartTemplateRepository({})).toBe('SaxonF/templates')
    expect(getStartTemplateRef({})).toBe('main')
    expect(getStartTemplateRegistryCommandOptions({})).toEqual({
      registrySlug: 'SaxonF/templates',
    })
  })

  it('supports public repository URLs for client-visible shadcn commands', () => {
    const env = {
      NEXT_PUBLIC_START_TEMPLATE_REPOSITORY: 'https://github.com/supabase/templates',
    }

    expect(getStartTemplateRepository(env)).toBe('https://github.com/supabase/templates')
    expect(getStartTemplateRegistryCommandOptions(env)).toEqual({
      registrySlug: 'https://github.com/supabase/templates',
    })
  })

  it('lets server-only repository and ref env vars override public defaults', () => {
    const env = {
      START_TEMPLATE_REPOSITORY: 'supabase/templates',
      START_TEMPLATE_REF: 'stable',
      NEXT_PUBLIC_START_TEMPLATE_REPOSITORY: 'SaxonF/templates',
      NEXT_PUBLIC_START_TEMPLATE_REF: 'main',
    }

    expect(getStartTemplateRepository(env)).toBe('supabase/templates')
    expect(getStartTemplateRef(env)).toBe('stable')
  })
})
