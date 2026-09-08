import { describe, expect, it } from 'vitest'

import { MessageActions } from './Message.Actions'
import { customRender } from '@/tests/lib/custom-render'

describe('MessageActions', () => {
  it('uses the standard centered message width', () => {
    const { container } = customRender(
      <MessageActions>
        <button type="button" tabIndex={0}>
          Copy
        </button>
      </MessageActions>
    )

    expect(container.firstChild).toHaveClass('w-full', 'max-w-3xl', 'mx-auto')
  })
})
