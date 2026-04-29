import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ShortcutsReferenceSheet } from './ShortcutsReferenceSheet'
import { SHORTCUT_DEFINITIONS } from '@/state/shortcuts/registry'
import { customRender } from '@/tests/lib/custom-render'

const NAVIGATION_LABELS = Object.values(SHORTCUT_DEFINITIONS)
  .filter((definition) => definition.id.startsWith('nav.'))
  .map((definition) => definition.label)

const renderShortcutsReferenceSheet = () => {
  const onOpenChange = vi.fn()

  customRender(<ShortcutsReferenceSheet open onOpenChange={onOpenChange} />)

  return { onOpenChange }
}

describe('ShortcutsReferenceSheet', () => {
  it('renders the grouped shortcut list by default', async () => {
    renderShortcutsReferenceSheet()

    expect(await screen.findByText('Keyboard shortcuts')).toBeInTheDocument()
    expect(screen.getByLabelText('Search shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Command Menu')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Open command menu')).toBeInTheDocument()
    expect(screen.getByText('Go to Project Overview')).toBeInTheDocument()
  })

  it('shows every shortcut in a group when the group label matches the search', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'navigation')

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.queryByText('Command Menu')).not.toBeInTheDocument()

    for (const label of NAVIGATION_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('keeps the parent group header when only an item label matches', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'Go to Organization Integrations')

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Go to Organization Integrations')).toBeInTheDocument()
    expect(screen.queryByText('Go to Logs')).not.toBeInTheDocument()
    expect(screen.queryByText('Command Menu')).not.toBeInTheDocument()
  })

  it('shows a clear button when searching and resets the list when clicked', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'navigation')

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByLabelText('Search shortcuts')).toHaveValue('')
    expect(screen.getByText('Command Menu')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
  })

  it.each(['⌘Esc', 'Mod+/'])('does not search shortcut values like %s', async (query) => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), query)

    expect(screen.getByText('No matching shortcuts found')).toBeInTheDocument()
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'totally missing')

    expect(screen.getByText('No matching shortcuts found')).toBeInTheDocument()
  })
})
