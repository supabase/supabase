import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import JWTKeysLayout from './JWTKeysLayout'
import { customRender } from '@/tests/lib/custom-render'

describe('JWTKeysLayout', () => {
  it('marks only the nested tab as the current page on the legacy route', () => {
    customRender(
      <JWTKeysLayout>
        <div>Legacy content</div>
      </JWTKeysLayout>,
      { initialUrl: '/project/default/settings/jwt/legacy' }
    )

    const legacyLink = screen.getByRole('link', { name: 'Legacy JWT Secret' })
    const signingKeysLink = screen.getByRole('link', { name: 'JWT Signing Keys' })

    expect(legacyLink).toHaveAttribute('aria-current', 'page')
    expect(legacyLink.closest('li')).toHaveAttribute('aria-selected', 'true')
    expect(signingKeysLink).not.toHaveAttribute('aria-current')
    expect(signingKeysLink.closest('li')).toHaveAttribute('aria-selected', 'false')
  })

  it('keeps the signing keys tab marked as current when query params are present', () => {
    customRender(
      <JWTKeysLayout>
        <div>Signing keys content</div>
      </JWTKeysLayout>,
      { initialUrl: '/project/default/settings/jwt?view=standby' }
    )

    const signingKeysLink = screen.getByRole('link', { name: 'JWT Signing Keys' })
    const legacyLink = screen.getByRole('link', { name: 'Legacy JWT Secret' })

    expect(signingKeysLink).toHaveAttribute('aria-current', 'page')
    expect(signingKeysLink.closest('li')).toHaveAttribute('aria-selected', 'true')
    expect(legacyLink).not.toHaveAttribute('aria-current')
    expect(legacyLink.closest('li')).toHaveAttribute('aria-selected', 'false')
  })
})
