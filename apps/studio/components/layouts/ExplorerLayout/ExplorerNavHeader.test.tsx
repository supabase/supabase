import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExplorerResourceType } from './ExplorerLayout.constants'
import { ExplorerNavHeader } from './ExplorerNavHeader'
import { ProductMenuBar } from '@/components/layouts/Navigation/ProductMenuBar'
import { customRender } from '@/tests/lib/custom-render'

const createNotebook = vi.fn()
const createChat = vi.fn()
vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateNotebook: () => ({ createNotebook }),
  useCreateChat: () => ({ createChat }),
}))

function renderHeader(section?: ExplorerResourceType) {
  const onBack = vi.fn()
  customRender(
    <ProductMenuBar
      title="Explorer"
      header={
        <ExplorerNavHeader
          section={section}
          onBack={onBack}
          rootAction={<span>Switch to SQL Editor</span>}
        />
      }
    />
  )
  return { onBack }
}

describe('Explorer sidebar header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the smaller root title with the SQL action', () => {
    renderHeader()
    expect(screen.getAllByText('Explorer')).toHaveLength(1)
    expect(screen.getByText('Explorer')).toHaveClass('text-sm')
    expect(screen.getByText('Switch to SQL Editor')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it.each([
    { section: 'notebook', parent: 'Explorer', current: 'Notebooks' },
    { section: 'chat', parent: 'Explorer', current: 'Chats' },
  ] satisfies { section: ExplorerResourceType; parent: string; current: string }[])(
    'shows only $parent → $current and returns via the parent breadcrumb',
    async ({ section, parent, current }) => {
      const { onBack } = renderHeader(section)
      const breadcrumb = screen.getByRole('navigation', { name: 'Explorer navigation' })
      expect(within(breadcrumb).getByRole('button', { name: parent })).toBeInTheDocument()
      expect(within(breadcrumb).getByRole('link', { name: current })).toHaveAttribute(
        'aria-current',
        'page'
      )
      expect(within(breadcrumb).getAllByRole('listitem')).toHaveLength(2)
      expect(screen.queryByText('Switch to SQL Editor')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: parent }))
      expect(onBack).toHaveBeenCalledOnce()
      screen.getByRole('button', { name: parent }).focus()
      await user.keyboard('{Enter}')
      expect(onBack).toHaveBeenCalledTimes(2)
    }
  )

  it.each(['notebook', 'chat'] as const)(
    'shows the create action only for the current %s level',
    async (level) => {
      renderHeader(level)
      await userEvent.click(screen.getByRole('button', { name: `New ${level}` }))
      expect(level === 'notebook' ? createNotebook : createChat).toHaveBeenCalledOnce()
      expect(level === 'notebook' ? createChat : createNotebook).not.toHaveBeenCalled()
    }
  )

  it('keeps the default title and badge for other product sidebars', () => {
    customRender(<ProductMenuBar title="Database" titleBadge={<span>Preview</span>} />)
    expect(screen.getByRole('heading', { name: 'Database' })).toHaveClass('text-sm')
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })
})
