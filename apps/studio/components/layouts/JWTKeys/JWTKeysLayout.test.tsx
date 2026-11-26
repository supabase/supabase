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

    expect(screen.getByRole('link', { name: 'Legacy JWT Secret' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'JWT Signing Keys' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('keeps the signing keys tab marked as current when query params are present', () => {
    customRender(
      <JWTKeysLayout>
        <div>Signing keys content</div>
      </JWTKeysLayout>,
      { initialUrl: '/project/default/settings/jwt?view=standby' }
    )

    expect(screen.getByRole('link', { name: 'JWT Signing Keys' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'Legacy JWT Secret' })).not.toHaveAttribute(
      'aria-current'
    )
  })
})
