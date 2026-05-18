import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Alert } from './alert'

describe('Alert', () => {
  it('keeps warning and destructive text colour explicit', () => {
    render(
      <>
        <Alert variant="warning">Warning copy</Alert>
        <Alert variant="destructive">Destructive copy</Alert>
      </>
    )

    expect(screen.getByText('Warning copy')).toHaveClass('text-foreground')
    expect(screen.getByText('Destructive copy')).toHaveClass('text-foreground')
  })
})
