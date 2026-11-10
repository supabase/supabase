import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ApiKeysLayout from './APIKeysLayout'
import { customRender } from '@/tests/lib/custom-render'

describe('ApiKeysLayout', () => {
  it('renders its children without tabs', () => {
    customRender(
      <ApiKeysLayout>
        <div>content</div>
      </ApiKeysLayout>
    )

    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.queryByText('Publishable and secret API keys')).not.toBeInTheDocument()
    expect(screen.queryByText('Legacy anon, service_role API keys')).not.toBeInTheDocument()
  })
})
