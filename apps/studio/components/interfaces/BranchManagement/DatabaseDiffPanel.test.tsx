import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DatabaseDiffPanel } from './DatabaseDiffPanel'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ui/DiffEditor', () => ({
  DiffEditor: vi.fn(({ language, original, modified, options }) => (
    <div
      data-testid="mock-diff-editor"
      data-language={language}
      data-original={original}
      data-modified={modified}
      data-readonly={options?.readOnly ? 'true' : 'false'}
    >
      {modified}
    </div>
  )),
}))

const renderPanel = (props: Partial<React.ComponentProps<typeof DatabaseDiffPanel>> = {}) => {
  return customRender(<DatabaseDiffPanel isLoading={false} {...props} />)
}

describe('DatabaseDiffPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders loading indicator when isLoading is true', () => {
    renderPanel({ isLoading: true })

    expect(screen.getByText('Loading database diff…')).toBeInTheDocument()
    expect(screen.queryByText('Error loading branch diff')).not.toBeInTheDocument()
    expect(screen.queryByText('No changes detected between branches')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mock-diff-editor')).not.toBeInTheDocument()
  })

  test('renders error state when error is provided', () => {
    renderPanel({
      isLoading: false,
      error: new Error('Failed to fetch diff'),
    })

    expect(screen.getByText('Error loading branch diff')).toBeInTheDocument()
    expect(
      screen.getByText(/Please try again in a few minutes and contact support/i)
    ).toBeInTheDocument()
    expect(screen.queryByTestId('mock-diff-editor')).not.toBeInTheDocument()
  })

  test('renders empty state when diffContent is empty or whitespace', () => {
    const { rerender } = renderPanel({ isLoading: false, diffContent: '' })

    expect(screen.getByText('No changes detected between branches')).toBeInTheDocument()
    expect(
      screen.getByText('Any changes to your database schema will be shown here for review')
    ).toBeInTheDocument()

    rerender(<DatabaseDiffPanel isLoading={false} diffContent="   \n\t  " />)
    expect(screen.getByText('No changes detected between branches')).toBeInTheDocument()
  })

  test('renders schema changes card and DiffEditor when diffContent is present', () => {
    const diffContent = 'CREATE TABLE books (id SERIAL PRIMARY KEY, title TEXT);'
    renderPanel({
      isLoading: false,
      diffContent,
      currentBranchRef: 'preview-branch-ref',
    })

    const schemaLink = screen.getByRole('link', { name: /Schema Changes/i })
    expect(schemaLink).toBeInTheDocument()
    expect(schemaLink).toHaveAttribute('href', '/project/preview-branch-ref/database/schema')

    const downloadButton = screen.getByRole('button', { name: /Download as migration/i })
    expect(downloadButton).toBeInTheDocument()

    const diffEditor = screen.getByTestId('mock-diff-editor')
    expect(diffEditor).toBeInTheDocument()
    expect(diffEditor).toHaveAttribute('data-language', 'sql')
    expect(diffEditor).toHaveAttribute('data-modified', diffContent)
    expect(diffEditor).toHaveAttribute('data-readonly', 'true')
  })

  test('triggers migration download and success toast on download click', async () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURLMock = vi.fn()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock

    const diffContent = 'ALTER TABLE users ADD COLUMN phone TEXT;'
    renderPanel({
      isLoading: false,
      diffContent,
      currentBranchRef: 'branch-ref-123',
    })

    const downloadButton = screen.getByRole('button', { name: /Download as migration/i })
    await userEvent.click(downloadButton)

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob
    expect(blobArg).toBeInstanceOf(Blob)
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url')
    expect(toast.success).toHaveBeenCalledWith('Migration file downloaded!')
  })
})
