import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { render } from 'tests/helpers'
import NewAccessTokenButton from '../NewAccessTokenButton'

describe(`NewAccessTokenButton`, () => {
  it(`works`, async () => {
    const onCreateToken = vi.fn()
    render(<NewAccessTokenButton onCreateToken={onCreateToken} />)
    await userEvent.click(screen.getByRole(`button`, { name: `Generate new token` }))
    await screen.findByLabelText(`Name`)

    expect(screen.getByRole('heading')).toHaveTextContent('Generate New Token')
  })
})
