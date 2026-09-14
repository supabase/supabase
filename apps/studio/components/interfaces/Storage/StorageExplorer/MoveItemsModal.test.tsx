import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItemWithColumn } from '../Storage.types'
import { MoveItemsModal } from './MoveItemsModal'
import type { components } from '@/data/api'
import { clickDropdown } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type StorageObject = components['schemas']['StorageObject_Output']

const createFolder = (name: string): StorageObject => ({
  id: null,
  name,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  metadata: null,
})

const createFile = (name: string): StorageObject => ({
  id: `id-${name}`,
  name,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_accessed_at: '2024-01-01T00:00:00Z',
  metadata: { size: 1024, mimetype: 'image/png' },
})

/** Contents of the fake bucket the picker browses, keyed by folder path */
const BUCKET_CONTENTS: Record<string, StorageObject[]> = {
  '': [
    createFolder('photos'),
    createFolder('photos-old'),
    createFolder('invoices'),
    createFile('avatar.png'),
  ],
  photos: [createFolder('2024'), createFile('beach.png')],
  'photos/2024': [createFolder('q1')],
  'photos/2024/q1': [],
  invoices: [],
}

const mockObjectsList = () =>
  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list',
    response: async ({ request }) => {
      const body = (await request.json()) as { path: string }
      return HttpResponse.json(BUCKET_CONTENTS[body.path] ?? [])
    },
  })

const selectedFile: StorageItemWithColumn = {
  id: 'id-avatar.png',
  name: 'avatar.png',
  type: STORAGE_ROW_TYPES.FILE,
  status: STORAGE_ROW_STATUS.READY,
  metadata: null,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  isCorrupted: false,
  columnIndex: 0,
}

const renderModal = (props: Partial<Parameters<typeof MoveItemsModal>[0]> = {}) => {
  const onSelectMove = vi.fn()
  const onSelectCancel = vi.fn()

  customRender(
    <MoveItemsModal
      visible
      projectRef="default"
      bucketId="avatars"
      bucketName="avatars"
      selectedItemsToMove={[selectedFile]}
      openedFolders={[]}
      onSelectCancel={onSelectCancel}
      onSelectMove={onSelectMove}
      {...props}
    />
  )

  return { onSelectMove, onSelectCancel }
}

describe('MoveItemsModal', () => {
  beforeAll(() => {
    // The picker virtualizes its rows, and jsdom reports every element as zero-sized, which
    // would leave the list empty. Give the scroll container a viewport to render into.
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 640 })
  })

  afterAll(() => {
    // @ts-expect-error -- restoring jsdom's own zero-size getters
    delete HTMLElement.prototype.offsetHeight
    // @ts-expect-error -- restoring jsdom's own zero-size getters
    delete HTMLElement.prototype.offsetWidth
  })

  beforeEach(() => {
    mockObjectsList()
  })

  it('names the item being moved and defaults the destination to the bucket root', async () => {
    renderModal()

    expect(await screen.findByText('Move avatar.png')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'photos' })).toBeInTheDocument()
    expect(screen.getByText('avatars', { selector: 'span.font-mono' })).toBeInTheDocument()
  })

  it('lists folders only, leaving files out entirely', async () => {
    renderModal()

    await screen.findByRole('button', { name: 'photos' })
    expect(screen.getByRole('button', { name: 'invoices' })).toBeInTheDocument()
    expect(screen.queryByText('avatar.png')).not.toBeInTheDocument()
  })

  it('marks the destination folder in the search results', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(await screen.findByRole('button', { name: 'photos' }))
    await screen.findByRole('button', { name: 'Move to photos' })

    await user.type(screen.getByPlaceholderText('Search folders in avatars...'), 'photos')

    expect(await screen.findByRole('button', { name: 'photos in avatars' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    expect(screen.getByRole('button', { name: 'photos-old in avatars' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('keeps paging until it finds folders hidden behind a page of files', async () => {
    const files = Array.from({ length: 200 }, (_, index) => createFile(`file-${index}.png`))
    addAPIMock({
      method: 'post',
      path: '/platform/storage/:ref/buckets/:id/objects/list',
      response: async ({ request }) => {
        const body = (await request.json()) as { options?: { offset?: number } }
        const isFirstPage = (body.options?.offset ?? 0) === 0
        return HttpResponse.json(isFirstPage ? files : [createFolder('buried')])
      },
    })

    renderModal()

    expect(await screen.findByRole('button', { name: 'buried' })).toBeInTheDocument()
  })

  it('collapses the middle of a deep path into a dropdown', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(await screen.findByRole('button', { name: 'photos' }))
    await user.click(await screen.findByRole('button', { name: '2024' }))
    await user.click(await screen.findByRole('button', { name: 'q1' }))
    await screen.findByRole('button', { name: 'Move to q1' })

    // The bucket and the last two folders stay visible, so only "photos" collapses
    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(within(breadcrumb).getByText('avatars')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('2024')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('q1')).toBeInTheDocument()
    expect(within(breadcrumb).queryByText('photos')).not.toBeInTheDocument()

    clickDropdown(within(breadcrumb).getByLabelText('Show the folders in between'))

    const collapsedItem = await screen.findByRole('menuitem', { name: 'photos' })
    await user.click(collapsedItem)

    expect(await screen.findByRole('button', { name: 'Move to photos' })).toBeInTheDocument()
  })

  it('keeps a shallow path fully visible', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(await screen.findByRole('button', { name: 'photos' }))
    await screen.findByRole('button', { name: 'Move to photos' })

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(within(breadcrumb).getByText('photos')).toBeInTheDocument()
    expect(
      within(breadcrumb).queryByLabelText('Show the folders in between')
    ).not.toBeInTheDocument()
  })

  it('blocks moving items into the folder they are already in', async () => {
    renderModal()

    const moveButton = await screen.findByRole('button', { name: 'Move to avatars' })
    expect(moveButton).toBeAriaDisabled()
  })

  it('opens a folder on click and moves items into it', async () => {
    const user = userEvent.setup()
    const { onSelectMove } = renderModal()

    await user.click(await screen.findByRole('button', { name: 'photos' }))

    expect(await screen.findByRole('button', { name: '2024' })).toBeInTheDocument()
    const moveButton = await screen.findByRole('button', { name: 'Move to photos' })
    expect(moveButton).toBeEnabled()

    await user.click(moveButton)
    expect(onSelectMove).toHaveBeenCalledWith('photos')
  })

  it('navigates back up through the breadcrumb', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(await screen.findByRole('button', { name: 'photos' }))
    await screen.findByRole('button', { name: 'Move to photos' })

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    await user.click(within(breadcrumb).getByRole('button', { name: 'avatars' }))

    expect(await screen.findByRole('button', { name: 'Move to avatars' })).toBeInTheDocument()
  })

  it('swaps the listing for matching folders while searching', async () => {
    const user = userEvent.setup()
    renderModal()

    await screen.findByRole('button', { name: 'photos' })
    await user.type(screen.getByPlaceholderText('Search folders in avatars...'), '2024')

    expect(await screen.findByRole('button', { name: '2024 in photos' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('invoices')).not.toBeInTheDocument())
  })

  it('selects a searched folder as the destination', async () => {
    const user = userEvent.setup()
    const { onSelectMove } = renderModal()

    await screen.findByRole('button', { name: 'photos' })
    await user.type(screen.getByPlaceholderText('Search folders in avatars...'), '2024')

    await user.click(await screen.findByRole('button', { name: '2024 in photos' }))
    await user.click(await screen.findByRole('button', { name: 'Move to 2024' }))

    expect(onSelectMove).toHaveBeenCalledWith('photos/2024')
  })
})
