import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CommandWrapper } from './CommandMenu'
import { CommandMenuInput } from './CommandMenuInput'
import { CommandProvider } from './CommandProvider'
import { useCurrentPage, useRegisterPage, useSetPage } from './hooks/pagesHooks'
import { useQuery } from './hooks/queryHooks'
import { PageType } from './utils'

/**
 * Helper component that displays the active Command Menu page name and query string for assertions.
 */
const CommandStateInspector = () => {
  const currentPage = useCurrentPage()
  const query = useQuery()

  return (
    <div>
      <div data-testid="active-page">{currentPage?.name ?? 'root'}</div>
      <div data-testid="active-query">{query}</div>
    </div>
  )
}

/**
 * Test harness rendering an uncontrolled CommandMenuInput inside a registered subpage.
 */
const UncontrolledSearchSubpage = () => {
  const setPage = useSetPage()
  useRegisterPage('Search Edge Functions', { type: PageType.Commands, sections: [] })

  return (
    <div>
      <button type="button" onClick={() => setPage('Search Edge Functions')}>
        Open Edge Functions Search
      </button>
      <CommandWrapper>
        <CommandMenuInput placeholder="Search edge functions..." />
      </CommandWrapper>
      <CommandStateInspector />
    </div>
  )
}

/**
 * Test harness rendering a controlled CommandMenuInput inside a registered subpage.
 */
const ControlledSearchSubpage = () => {
  const setPage = useSetPage()
  const [filterString, setFilterString] = useState('')
  useRegisterPage('Search Storage', { type: PageType.Commands, sections: [] })

  return (
    <div>
      <button type="button" onClick={() => setPage('Search Storage')}>
        Open Storage Search
      </button>
      <CommandWrapper>
        <CommandMenuInput
          placeholder="Search buckets..."
          value={filterString}
          onValueChange={setFilterString}
        />
      </CommandWrapper>
      <CommandStateInspector />
    </div>
  )
}

describe('CommandMenuInput', () => {
  it('deletes characters with Backspace when non-empty and pops the page only when empty (uncontrolled)', async () => {
    const user = userEvent.setup()
    render(
      <CommandProvider>
        <UncontrolledSearchSubpage />
      </CommandProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Edge Functions Search' }))
    expect(screen.getByTestId('active-page')).toHaveTextContent('Search Edge Functions')

    const input = screen.getByPlaceholderText('Search edge functions...')
    await user.type(input, 'webhook')
    expect(screen.getByTestId('active-query')).toHaveTextContent('webhook')

    await user.type(input, '{backspace}')
    expect(screen.getByTestId('active-page')).toHaveTextContent('Search Edge Functions')
    expect(screen.getByTestId('active-query')).toHaveTextContent('webhoo')

    await user.clear(input)
    expect(screen.getByTestId('active-query')).toHaveTextContent('')

    await user.type(input, '{backspace}')
    expect(screen.getByTestId('active-page')).toHaveTextContent('root')
  })

  it('synchronizes controlled value and onValueChange with CommandMenu query and only pops on Backspace when empty', async () => {
    const user = userEvent.setup()
    render(
      <CommandProvider>
        <ControlledSearchSubpage />
      </CommandProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Storage Search' }))
    expect(screen.getByTestId('active-page')).toHaveTextContent('Search Storage')

    const input = screen.getByPlaceholderText('Search buckets...')
    await user.type(input, 'avatars')
    expect(input).toHaveValue('avatars')
    expect(screen.getByTestId('active-query')).toHaveTextContent('avatars')

    await user.type(input, '{backspace}')
    expect(screen.getByTestId('active-page')).toHaveTextContent('Search Storage')
    expect(input).toHaveValue('avatar')
    expect(screen.getByTestId('active-query')).toHaveTextContent('avatar')

    await user.clear(input)
    expect(input).toHaveValue('')

    await user.type(input, '{backspace}')
    expect(screen.getByTestId('active-page')).toHaveTextContent('root')
  })
})
