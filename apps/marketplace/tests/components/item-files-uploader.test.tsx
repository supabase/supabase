import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-supabase-upload', () => ({
  useSupabaseUpload: () => ({
    files: [],
    onUpload: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/components/dropzone', () => ({
  Dropzone: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropzoneEmptyState: () => <div data-testid="dropzone-empty" />,
  DropzoneContent: () => <div data-testid="dropzone-content" />,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    storage: {
      from: () => ({
        createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
  }),
}))

import { ItemFilesUploader } from '@/components/item-files-uploader'

describe('ItemFilesUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks removed persisted file ids', async () => {
    const user = userEvent.setup()
    const onRemovedFileIdsChange = vi.fn()

    render(
      <ItemFilesUploader
        partnerId={1}
        itemId={2}
        initialFiles={[{ id: 10, file_path: '1/items/2/files/readme.txt', sort_order: 0 }]}
        onRemovedFileIdsChange={onRemovedFileIdsChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Remove readme.txt' }))
    expect(onRemovedFileIdsChange).toHaveBeenCalledWith([10])
  })
})
