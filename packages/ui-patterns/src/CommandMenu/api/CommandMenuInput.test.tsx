import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CommandProvider } from './CommandProvider'
import { CommandWrapper } from './CommandMenu'
import { CommandMenuInput } from './CommandMenuInput'
import { PageType } from './utils'
import { useCurrentPage, useRegisterPage, useSetPage } from './hooks/pagesHooks'
import { useQuery } from './hooks/queryHooks'

const PageDisplay = () => {
  const currentPage = useCurrentPage()
  const query = useQuery()

  return (
    <div>
      <div data-testid="current-page">{currentPage?.name ?? '[Root]'}</div>
      <div data-testid="current-query">{query}</div>
    </div>
  )
}

const SubpageWithUncontrolledInput = () => {
  const setPage = useSetPage()
  useRegisterPage('Subpage', { type: PageType.Commands, sections: [] })

  return (
    <div>
      <button type="button" onClick={() => setPage('Subpage')}>
        Go to subpage
      </button>
      <CommandWrapper>
        <CommandMenuInput placeholder="Search..." />
      </CommandWrapper>
      <PageDisplay />
    </div>
  )
}

const SubpageWithControlledInput = () => {
  const setPage = useSetPage()
  const [val, setVal] = useState('')
  useRegisterPage('Controlled Subpage', { type: PageType.Commands, sections: [] })

  return (
    <div>
      <button type="button" onClick={() => setPage('Controlled Subpage')}>
        Go to controlled subpage
      </button>
      <CommandWrapper>
        <CommandMenuInput
          placeholder="Search controlled..."
          value={val}
          onValueChange={setVal}
        />
      </CommandWrapper>
      <PageDisplay />
    </div>
  )
}

describe('CommandMenuInput', () => {
  it('updates query and does not pop page on Backspace when text is present (uncontrolled)', async () => {
    const user = userEvent.setup()
    render(
      <CommandProvider>
        <SubpageWithUncontrolledInput />
      </CommandProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Go to subpage' }))
    expect(screen.getByTestId('current-page')).toHaveTextContent('Subpage')

    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'test')
    expect(screen.getByTestId('current-query')).toHaveTextContent('test')

    // Press Backspace while input has text -> page does NOT pop
    await user.type(input, '{backspace}')
    expect(screen.getByTestId('current-page')).toHaveTextContent('Subpage')
    expect(screen.getByTestId('current-query')).toHaveTextContent('tes')

    // Delete remaining characters
    await user.clear(input)
    expect(screen.getByTestId('current-query')).toHaveTextContent('')

    // Press Backspace when input is empty -> pops page
    await user.type(input, '{backspace}')
    expect(screen.getByTestId('current-page')).toHaveTextContent('[Root]')
  })

  it('updates query, forwards onValueChange, and does not pop page on Backspace when text is present (controlled)', async () => {
    const user = userEvent.setup()
    render(
      <CommandProvider>
        <SubpageWithControlledInput />
      </CommandProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Go to controlled subpage' }))
    expect(screen.getByTestId('current-page')).toHaveTextContent('Controlled Subpage')

    const input = screen.getByPlaceholderText('Search controlled...')
    await user.type(input, 'hello')
    expect(screen.getByTestId('current-query')).toHaveTextContent('hello')
    expect(input).toHaveValue('hello')

    // Press Backspace while controlled input has text -> page does NOT pop
    await user.type(input, '{backspace}')
    expect(screen.getByTestId('current-page')).toHaveTextContent('Controlled Subpage')
    expect(screen.getByTestId('current-query')).toHaveTextContent('hell')

    // Clear input
    await user.clear(input)
    expect(input).toHaveValue('')

    // Press Backspace when controlled input is empty -> pops page
    await user.type(input, '{backspace}')
    expect(screen.getByTestId('current-page')).toHaveTextContent('[Root]')
  })
})
