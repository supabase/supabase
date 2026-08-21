import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MessageActions } from './Message.Actions'

describe('MessageActions', () => {
  it('uses the standard centered message width', () => {
    const { container } = render(
      <MessageActions>
        <button type="button" tabIndex={0}>
          Copy
        </button>
      </MessageActions>
    )

    expect(container.firstChild).toHaveClass('w-full', 'max-w-3xl', 'mx-auto')
  })
})
