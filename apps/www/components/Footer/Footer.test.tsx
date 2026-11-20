import Footer from '.'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('~/lib/supabase', () => ({ default: {} }))
vi.mock('data/Solutions', () => ({
  appTypeSolutions: { solutions: [] },
  migrationSolutions: { solutions: [] },
  skillBasedSolutions: { solutions: [] },
  useCaseSolutions: { solutions: [] },
}))

describe('Footer', () => {
  it('shows the privacy link once, beside the copyright', () => {
    const html = renderToStaticMarkup(<Footer />)
    const label = 'Do Not Sell or Share My Personal Information'

    expect(html.split(label)).toHaveLength(2)
    expect(html.indexOf(label)).toBeGreaterThan(html.indexOf('© Supabase Inc'))
  })
})
