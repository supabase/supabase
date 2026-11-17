import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FooterBottomRow } from './Footer'

describe('FooterBottomRow', () => {
  it('renders the opt-out label before the country is known', () => {
    expect(renderToStaticMarkup(<FooterBottomRow />)).toContain(
      'Do Not Sell or Share My Personal Information'
    )
  })
})
