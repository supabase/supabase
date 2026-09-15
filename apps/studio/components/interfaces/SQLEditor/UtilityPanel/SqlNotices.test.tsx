import { getDefaultNormalizer, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SqlNotices } from './SqlNotices'
import { customRender as render } from '@/tests/lib/custom-render'

describe('SqlNotices', () => {
  it('renders nothing when there are no notices', () => {
    const { container } = render(<SqlNotices notices={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('prints each notice the way psql does', () => {
    render(
      <SqlNotices
        notices={[
          {
            severity: 'WARNING',
            code: '01000',
            message: 'no privileges were granted for "messages"',
          },
          { severity: 'NOTICE', message: 'careful', hint: 'a hint' },
        ]}
      />
    )

    // Keep psql's two-space separator intact instead of letting the matcher collapse it
    const exact = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) }
    expect(
      screen.getByText('WARNING:  no privileges were granted for "messages"', exact)
    ).toBeInTheDocument()
    expect(screen.getByText('NOTICE:  careful', exact)).toBeInTheDocument()
    expect(screen.getByText('HINT:  a hint', exact)).toBeInTheDocument()
  })
})
