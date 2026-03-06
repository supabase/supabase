import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ItemForm } from '@/components/item-form'

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

describe('ItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows creating a template draft without a zip package', async () => {
    const user = userEvent.setup()
    createItemDraftActionMock.mockResolvedValue({
      itemId: 1,
      itemSlug: 'auth-template',
      partnerSlug: 'acme',
    })

    render(<ItemForm mode="create" partner={{ id: 1, slug: 'acme' }} />)

    await user.type(screen.getByPlaceholderText('Authentication starter'), 'Auth Template')
    await user.click(screen.getByRole('button', { name: 'Create item' }))

    await waitFor(() => expect(createItemDraftActionMock).toHaveBeenCalledTimes(1))
    expect(
      screen.queryByText('Upload a template ZIP package that includes template.json.')
    ).not.toBeInTheDocument()
  })
})
