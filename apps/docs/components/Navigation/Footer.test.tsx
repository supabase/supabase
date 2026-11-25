import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FooterBottomRow } from './Footer'

describe('FooterBottomRow', () => {
  it('renders the opt-out label hidden before the country is known', () => {
    const html = renderToStaticMarkup(<FooterBottomRow />)
    expect(html).toContain(
      '<span class="invisible">Do Not Sell or Share My Personal Information</span>'
    )
  })
})
