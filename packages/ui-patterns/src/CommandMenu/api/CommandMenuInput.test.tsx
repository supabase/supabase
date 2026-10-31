import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PageType } from '../internal/state/pagesState'
import { CommandWrapper } from './CommandMenu'
import { CommandMenuInput } from './CommandMenuInput'
import { CommandProvider } from './CommandProvider'
import { useCurrentPage, useRegisterPage, useSetPage } from './hooks/pagesHooks'
import { useQuery } from './hooks/queryHooks'

vi.mock('next/compat/router', () => ({
  useRouter: () => null,
}))

const SUBPAGE = 'Search things'

const ControlledInput = () => {
  const [value, setValue] = useState('')
  return <CommandMenuInput value={value} onValueChange={setValue} />
}

const Harness = ({ controlled }: { controlled: boolean }) => {
  const page = useCurrentPage()
  const query = useQuery()
  const setPage = useSetPage()

  useRegisterPage(SUBPAGE, {
    type: PageType.Component,
    component: () => null,
  })

  return (
    <>
      <button type="button" tabIndex={0} onClick={() => setPage(SUBPAGE)}>
        Open subpage
      </button>
      <span data-testid="page">{page?.name ?? 'root'}</span>
      <span data-testid="query">{query}</span>
      <CommandWrapper>{controlled ? <ControlledInput /> : <CommandMenuInput />}</CommandWrapper>
    </>
  )
}

const renderHarness = async (controlled: boolean) => {
  render(
    <CommandProvider openKey="">
      <Harness controlled={controlled} />
    </CommandProvider>
  )
  await userEvent.click(screen.getByRole('button', { name: 'Open subpage' }))
}

describe.each([
  { mode: 'uncontrolled', controlled: false },
  { mode: 'controlled', controlled: true },
])('CommandMenuInput ($mode)', ({ controlled }) => {
  it('shows typed text and syncs it to the query', async () => {
    await renderHarness(controlled)
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'abc')

    expect(input).toHaveValue('abc')
    expect(screen.getByTestId('query')).toHaveTextContent('abc')
    expect(screen.getByTestId('page')).toHaveTextContent(SUBPAGE)
  })

  it('deletes characters on backspace and only pops the page once empty', async () => {
    await renderHarness(controlled)
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'ab')
    await userEvent.type(input, '{Backspace}')
    expect(input).toHaveValue('a')
    expect(screen.getByTestId('query')).toHaveTextContent('a')
    expect(screen.getByTestId('page')).toHaveTextContent(SUBPAGE)

    await userEvent.type(input, '{Backspace}')
    expect(input).toHaveValue('')
    expect(screen.getByTestId('query')).toHaveTextContent('')
    expect(screen.getByTestId('page')).toHaveTextContent(SUBPAGE)

    await userEvent.type(input, '{Backspace}')
    expect(screen.getByTestId('page')).toHaveTextContent('root')
  })
})
