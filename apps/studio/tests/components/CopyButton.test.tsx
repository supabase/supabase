import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import CopyButton from '@/components/ui/CopyButton'
import { render } from '@/tests/helpers'

test('shows copied text', async () => {
  const callback = vi.fn()
  render(<CopyButton text="some text" onClick={callback} />)
  await userEvent.click(await screen.findByText('Copy'))
  await screen.findByText('Copied')
  expect(callback).toBeCalled()
})

test('does not show a green copied icon for primary buttons', async () => {
  const { container } = render(<CopyButton text="some text" type="primary" />)

  await userEvent.click(await screen.findByText('Copy'))
  await screen.findByText('Copied')

  const icon = container.querySelector('svg')
  expect(icon).toHaveClass('text-inherit')
  expect(icon).not.toHaveClass('text-brand')
})
