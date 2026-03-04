import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const createItemDraftActionMock = vi.fn()
const updateItemDraftActionMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: { from: () => ({ list: vi.fn() }) },
  }),
}))

vi.mock('@/components/item-files-uploader', () => ({
  ItemFilesUploader: () => <div data-testid="item-files-uploader" />,
}))

vi.mock('@/app/protected/actions', () => ({
  createItemDraftAction: (...args: unknown[]) => createItemDraftActionMock(...args),
  updateItemDraftAction: (...args: unknown[]) => updateItemDraftActionMock(...args),
}))

import { ItemForm } from '@/components/item-form'

describe('ItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows template zip validation error in create mode', async () => {
    const user = userEvent.setup()
    render(<ItemForm mode="create" partner={{ id: 1, slug: 'acme' }} />)

    await user.type(screen.getByPlaceholderText('Authentication starter'), 'Auth Template')
    await user.click(screen.getByRole('button', { name: 'Create item' }))

    expect(
      await screen.findByText('Upload a template ZIP package that includes registry-item.json.')
    ).toBeInTheDocument()
    expect(createItemDraftActionMock).not.toHaveBeenCalled()
  })
})
