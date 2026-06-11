import { describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from './config'
import { parseStartConfigFromSearchParams, startConfigToSearchParams } from './start-search-params'
import { getStartTemplates } from './template-catalog'

const templates = getStartTemplates()

describe('startSearchParams', () => {
  it('round-trips the default config', () => {
    const params = startConfigToSearchParams(DEFAULT_CONFIG)
    const cfg = parseStartConfigFromSearchParams(params, templates)

    expect(cfg).toEqual(DEFAULT_CONFIG)
  })

  it('normalizes invalid URL values back to defaults', () => {
    const cfg = parseStartConfigFromSearchParams(
      {
        project: 'new',
        framework: 'nextjs',
        shadcn: true,
        primitives: ['database', 'not-a-primitive' as never],
        orm: 'none',
        connection: 'remote',
        agent: 'claude',
        templates: ['todos', 'missing-template'],
      },
      templates
    )

    expect(cfg.primitives).toEqual(['database'])
    expect(cfg.templateIds).toEqual(['todos'])
  })

  it('clears shadcn when framework is backend-only', () => {
    const cfg = parseStartConfigFromSearchParams(
      {
        ...startConfigToSearchParams(DEFAULT_CONFIG),
        framework: 'none',
        shadcn: true,
      },
      templates
    )

    expect(cfg.framework).toBe('none')
    expect(cfg.shadcn).toBe(false)
  })
})
