import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

import { EndpointRow } from './EndpointRow'
import { customRender } from '@/tests/lib/custom-render'

const user = userEvent.setup({ writeToClipboard: true })

describe('EndpointRow', () => {
  test('copies the endpoint path on click', async () => {
    customRender(
      <EndpointRow
        method="GET"
        path="/v1/projects/{ref}/config"
        sharedPrefix=""
        methodColumnWidth="5ch"
      />
    )

    // Must be a real click, which focuses the button: copyToClipboard bails out when the
    // document has no focus
    await user.click(screen.getByRole('button', { name: 'Copy GET /v1/projects/{ref}/config' }))

    await waitFor(async () =>
      expect(await window.navigator.clipboard.readText()).toBe('/v1/projects/{ref}/config')
    )
  })
})
