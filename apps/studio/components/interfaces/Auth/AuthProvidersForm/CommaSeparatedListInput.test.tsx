import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test } from 'vitest'

import { CommaSeparatedListInput } from './CommaSeparatedListInput'

const CLIENT_IDS = 'web-1.com,android-2.com,chrome-3.com'

const Harness = ({ readOnly }: { readOnly?: boolean }) => {
  const [value, setValue] = useState(CLIENT_IDS)
  return (
    <CommaSeparatedListInput
      aria-label="Client IDs"
      value={value}
      readOnly={readOnly}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

describe('CommaSeparatedListInput', () => {
  test('shows one item per line, read-only, when not focused', () => {
    render(<Harness />)

    const textbox = screen.getByRole('textbox', { name: 'Client IDs' })
    expect(textbox).toHaveValue('web-1.com\nandroid-2.com\nchrome-3.com')
    expect(textbox).toHaveAttribute('readonly')
  })

  test('shows the original comma-separated string, editable, when focused', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const textbox = screen.getByRole('textbox', { name: 'Client IDs' })
    await user.click(textbox)

    expect(textbox).toHaveValue(CLIENT_IDS)
    expect(textbox).not.toHaveAttribute('readonly')
  })

  test('keeps the edited value comma-separated and goes back to lines on blur', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const textbox = screen.getByRole('textbox', { name: 'Client IDs' })
    await user.click(textbox)
    await user.clear(textbox)
    await user.paste('a.com,b.com')
    expect(textbox).toHaveValue('a.com,b.com')

    await user.tab()
    expect(textbox).toHaveValue('a.com\nb.com')
    expect(textbox).toHaveAttribute('readonly')
  })

  test('never becomes editable when the field is read-only', async () => {
    const user = userEvent.setup()
    render(<Harness readOnly />)

    const textbox = screen.getByRole('textbox', { name: 'Client IDs' })
    await user.click(textbox)

    expect(textbox).toHaveValue('web-1.com\nandroid-2.com\nchrome-3.com')
    expect(textbox).toHaveAttribute('readonly')
  })
})
