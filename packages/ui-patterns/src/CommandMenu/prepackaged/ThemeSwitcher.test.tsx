import {
  CommandProvider,
  PageType,
  useCommandMenuOpen,
  useCommands,
  useCurrentPage,
  useSetCommandMenuOpen,
} from '..'
import { act, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ICommand, ICommandSection } from '../internal/types'
import { useThemeSwitcherCommands } from './ThemeSwitcher'

const themeMock = vi.hoisted(() => ({
  setTheme: vi.fn(),
  state: {
    resolvedTheme: 'light' as string | undefined,
  },
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: themeMock.state.resolvedTheme,
    setTheme: themeMock.setTheme,
  }),
}))

type CurrentPage = ReturnType<typeof useCurrentPage>

const captured: {
  commandSections: ICommandSection[]
  currentPage: CurrentPage
  open: boolean
  setOpen?: (open: boolean) => void
} = {
  commandSections: [],
  currentPage: undefined,
  open: false,
  setOpen: undefined,
}

const ThemeSwitcherHarness = () => {
  useThemeSwitcherCommands()

  const commandSections = useCommands()
  const currentPage = useCurrentPage()
  const open = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()

  useEffect(() => {
    captured.commandSections = commandSections as ICommandSection[]
    captured.currentPage = currentPage
    captured.open = open
    captured.setOpen = setOpen
  }, [commandSections, currentPage, open, setOpen])

  return null
}

const renderHarness = async () => {
  const renderResult = render(
    <CommandProvider>
      <ThemeSwitcherHarness />
    </CommandProvider>
  )

  await waitFor(() => {
    expect(getThemeSection()).toBeDefined()
  })

  return renderResult
}

const getThemeSection = () => captured.commandSections.find((section) => section.name === 'Theme')

const getThemeCommand = (id: string) => {
  const command = getThemeSection()?.commands.find((x) => x.id === id)
  expect(command).toBeDefined()
  return command as ICommand
}

const runAction = (id: string) => {
  const command = getThemeCommand(id)
  expect('action' in command).toBe(true)
  const actionCommand = command as Extract<ICommand, { action: () => void }>

  act(() => {
    actionCommand.action()
  })
}

describe('useThemeSwitcherCommands', () => {
  beforeEach(() => {
    themeMock.setTheme.mockReset()
    themeMock.state.resolvedTheme = 'light'

    captured.commandSections = []
    captured.currentPage = undefined
    captured.open = false
    captured.setOpen = undefined
  })

  it('registers hidden direct theme commands in the root Theme section', async () => {
    await renderHarness()

    const themeSection = getThemeSection()
    expect(themeSection).toBeDefined()

    const ids = themeSection!.commands.map((command) => command.id)
    expect(ids).toEqual([
      'toggle-theme',
      'set-theme-dark',
      'set-theme-light',
      'set-theme-system',
      'switch-theme',
    ])

    expect(themeSection!.commands.every((command) => command.defaultHidden)).toBe(true)
  })

  it('adds root alias values so theme commands are discoverable by search terms', async () => {
    await renderHarness()

    const values = getThemeSection()!
      .commands.map((command) => command.value ?? '')
      .join(' ')
      .toLowerCase()

    expect(values).toContain('dark')
    expect(values).toContain('light')
    expect(values).toContain('toggle')
    expect(values).toContain('theme')
  })

  it('direct theme commands call setTheme and close the command menu', async () => {
    await renderHarness()

    act(() => {
      captured.setOpen?.(true)
    })

    await waitFor(() => {
      expect(captured.open).toBe(true)
    })

    runAction('set-theme-dark')

    await waitFor(() => {
      expect(themeMock.setTheme).toHaveBeenCalledWith('dark')
      expect(captured.open).toBe(false)
    })

    act(() => {
      captured.setOpen?.(true)
    })
    await waitFor(() => {
      expect(captured.open).toBe(true)
    })

    runAction('set-theme-light')

    await waitFor(() => {
      expect(themeMock.setTheme).toHaveBeenCalledWith('light')
      expect(captured.open).toBe(false)
    })

    act(() => {
      captured.setOpen?.(true)
    })
    await waitFor(() => {
      expect(captured.open).toBe(true)
    })

    runAction('set-theme-system')

    await waitFor(() => {
      expect(themeMock.setTheme).toHaveBeenCalledWith('system')
      expect(captured.open).toBe(false)
    })
  })

  it('toggle theme switches dark to light', async () => {
    themeMock.state.resolvedTheme = 'dark'
    await renderHarness()

    runAction('toggle-theme')

    expect(themeMock.setTheme).toHaveBeenCalledWith('light')
  })

  it('toggle theme switches non-dark modes to dark', async () => {
    themeMock.state.resolvedTheme = 'light'
    await renderHarness()

    runAction('toggle-theme')

    expect(themeMock.setTheme).toHaveBeenCalledWith('dark')
  })

  it('toggle theme uses the latest resolved theme across rerenders in the same session', async () => {
    const renderResult = await renderHarness()

    runAction('toggle-theme')
    expect(themeMock.setTheme).toHaveBeenLastCalledWith('dark')

    themeMock.state.resolvedTheme = 'dark'
    renderResult.rerender(
      <CommandProvider>
        <ThemeSwitcherHarness />
      </CommandProvider>
    )

    await waitFor(() => {
      expect(getThemeSection()).toBeDefined()
    })

    runAction('toggle-theme')
    expect(themeMock.setTheme).toHaveBeenLastCalledWith('light')
  })

  it('keeps the Switch theme submenu page with System/Dark/Light commands only', async () => {
    await renderHarness()

    runAction('switch-theme')

    await waitFor(() => {
      expect(captured.currentPage?.name).toBe('Switch theme')
    })

    expect(captured.currentPage?.type).toBe(PageType.Commands)
    const sections =
      captured.currentPage && 'sections' in captured.currentPage
        ? captured.currentPage.sections
        : []

    expect(sections).toHaveLength(1)
    expect(sections[0].name).toBe('Switch theme')

    const pageCommands = sections[0].commands
    expect(pageCommands.map((command) => command.name)).toEqual(['System', 'Dark', 'Light'])
    expect(pageCommands.map((command) => command.value)).toEqual([
      'System theme, Follow system appearance',
      'Dark theme, Dark mode',
      'Light theme, Light mode',
    ])
    expect(pageCommands.some((command) => command.name === 'Classic dark')).toBe(false)
  })
})
