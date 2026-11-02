import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { planetscale } from '../lib/comparisons/planetscale'
import { supabase } from '../lib/comparisons/supabase'
import { ComparisonTable } from './ComparisonTable'

describe('ComparisonTable', () => {
  const html = renderToStaticMarkup(<ComparisonTable profiles={[supabase, planetscale]} />)

  it('renders a column per profile and a row per characteristic', () => {
    expect(html).toContain('>Supabase<')
    expect(html).toContain('>PlanetScale<')
    expect(html).toContain('>Wire protocol<')
  })

  it('renders footnotes with links to their sources', () => {
    expect(html).toContain('id="comparison-note-1"')
    expect(html).toContain('https://supabase.com/docs/guides/self-hosting')
  })
})
