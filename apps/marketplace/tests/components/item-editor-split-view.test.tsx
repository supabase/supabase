import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/item-form', () => ({
  ItemForm: () => <div data-testid="item-form" />,
}))

vi.mock('ui-patterns/MarketplaceItem', () => ({
  MarketplaceItem: () => <div data-testid="marketplace-preview" />,
}))

import { ItemEditorSplitView } from '@/components/item-editor-split-view'

const baseEditProps = {
  mode: 'edit' as const,
  partner: { id: 1, slug: 'acme', title: 'Acme' },
  item: {
    id: 12,
    slug: 'auth-item',
    title: 'Auth Item',
    summary: null,
    content: null,
    type: 'oauth',
    url: 'https://example.com',
    registry_item_url: null,
    documentation_url: null,
    updated_at: null,
  },
  initialFiles: [],
}

describe('ItemEditorSplitView', () => {
  it('renders split view form and preview in edit mode', () => {
    render(<ItemEditorSplitView {...baseEditProps} />)

    expect(screen.getByTestId('item-form')).toBeInTheDocument()
    expect(screen.getByTestId('marketplace-preview')).toBeInTheDocument()
  })
})
