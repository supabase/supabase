import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PageType } from '../internal/state/pagesState'
import { CommandWrapper } from './CommandMenu'
import { CommandMenuInput } from './CommandMenuInput'
import { CommandProvider } from './CommandProvider'
import { useCurrentPage, useRegisterPage, useSetPage } from './hooks/pagesHooks'
import { useQuery } from './hooks/queryHooks'
import { useResetCommandMenu } from './hooks/viewHooks'

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

const ResetButton = () => {
  const resetCommandMenu = useResetCommandMenu()
  return (
    <button type="button" onClick={resetCommandMenu}>
      Reset
    </button>
  )
}

describe('CommandMenuInput search telemetry', () => {
  const PAST_DEBOUNCE_MS = 3000

  const renderWithTelemetry = () => {
    const onTelemetry = vi.fn()
    render(
      <CommandProvider openKey="" app="studio" onTelemetry={onTelemetry}>
        <ResetButton />
        <CommandWrapper>
          <CommandMenuInput />
        </CommandWrapper>
      </CommandProvider>
    )
    const searchEvents = () =>
      onTelemetry.mock.calls
        .map(([event]) => event)
        .filter((event) => event.action === 'command_menu_search_submitted')
    return searchEvents
  }

  const typedAbcOnce = [
    expect.objectContaining({ properties: expect.objectContaining({ queryLength: 3 }) }),
  ]

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sends the typed query once after the debounce', async () => {
    const searchEvents = renderWithTelemetry()

    await userEvent.type(screen.getByRole('combobox'), 'abc')
    act(() => vi.advanceTimersByTime(PAST_DEBOUNCE_MS))

    expect(searchEvents()).toEqual(typedAbcOnce)
  })

  it('sends nothing when the user clears the input before the debounce', async () => {
    const searchEvents = renderWithTelemetry()
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'abc')
    await userEvent.clear(input)
    act(() => vi.advanceTimersByTime(PAST_DEBOUNCE_MS))

    expect(searchEvents()).toEqual([])
  })

  it('sends the typed query when the menu resets before the debounce', async () => {
    const searchEvents = renderWithTelemetry()
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(input).toHaveValue('')
    act(() => vi.advanceTimersByTime(PAST_DEBOUNCE_MS))

    expect(searchEvents()).toEqual(typedAbcOnce)
  })
})
