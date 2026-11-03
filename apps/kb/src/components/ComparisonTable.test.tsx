import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { neon } from '../lib/comparisons/neon'
import { planetscale } from '../lib/comparisons/planetscale'
import { supabase } from '../lib/comparisons/supabase'
import type { CompetitorProfile } from '../lib/comparisons/types'
import { ComparisonTable } from './ComparisonTable'

describe('ComparisonTable', () => {
  const html = renderToStaticMarkup(<ComparisonTable profiles={[supabase, planetscale]} />)

  it('renders a column per profile and a row per characteristic', () => {
    expect(html).toContain('>Supabase<')
    expect(html).toContain('>PlanetScale<')
    expect(html).toContain('>Wire protocol<')
  })

  it('renders no footnotes for vendors without a footnote field', () => {
    const plainHtml = renderToStaticMarkup(<ComparisonTable profiles={[neon, planetscale]} />)
    expect(plainHtml).not.toContain('id="comparison-note-')
  })

  it('renders footnotes with links to their sources when a footnote is set', () => {
    const withFootnote = {
      ...supabase,
      deployment: {
        ...supabase.deployment,
        self_host: { ...supabase.deployment.self_host, footnote: 'Test footnote' },
      },
    } as CompetitorProfile
    const footnoteHtml = renderToStaticMarkup(<ComparisonTable profiles={[withFootnote]} />)

    expect(footnoteHtml).toContain('id="comparison-note-1"')
    expect(footnoteHtml).toContain('Test footnote')
    expect(footnoteHtml).toContain('https://supabase.com/docs/guides/self-hosting')
  })
})
