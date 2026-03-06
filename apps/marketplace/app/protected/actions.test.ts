import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addPartnerMemberAction,
  createItemAction,
  createItemDraftAction,
  createPartnerAction,
  requestItemReviewAction,
  saveItemReviewAction,
  updateItemAction,
  updateItemDraftAction,
  updateItemReviewAction,
  updatePartnerAction,
} from './actions'

const redirectMock = vi.fn()
const revalidatePathMock = vi.fn()
const createClientMock = vi.fn()
const jsZipLoadAsyncMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

vi.mock('jszip', () => ({
  default: {
    loadAsync: (...args: unknown[]) => jsZipLoadAsyncMock(...args),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}))

type Result<T = unknown> = { data: T; error: null | { message: string; code?: string } }

function success<T>(data: T): Result<T> {
  return { data, error: null }
}

function failure(message: string, code?: string): Result<null> {
  return { data: null, error: { message, code } }
}

function createSupabaseMock({
  user,
  fromHandler,
  storage,
  rpc,
}: {
  user: null | { id: string }
  fromHandler: (table: string, state: Record<string, unknown>) => Result
  storage?: {
    list?: (path: string) => Promise<Result<unknown[]>>
    remove?: (paths: string[]) => Promise<{ error: null | { message: string } }>
    upload?: (path: string) => Promise<{ error: null | { message: string } }>
    getPublicUrl?: (path: string) => { data: { publicUrl: string } }
  }
  rpc?: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ error: null | { message: string } }>
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    rpc: vi
      .fn()
      .mockImplementation((name, args) => rpc?.(name, args) ?? Promise.resolve({ error: null })),
    storage: {
      from: vi.fn().mockReturnValue({
        list: vi
          .fn()
          .mockImplementation(
            (path: string) => storage?.list?.(path) ?? Promise.resolve(success([]))
          ),
        remove: vi
          .fn()
          .mockImplementation(
            (paths: string[]) => storage?.remove?.(paths) ?? Promise.resolve({ error: null })
          ),
        upload: vi
          .fn()
          .mockImplementation(
            (path: string) => storage?.upload?.(path) ?? Promise.resolve({ error: null })
          ),
        getPublicUrl: vi
          .fn()
          .mockImplementation(
            (path: string) => storage?.getPublicUrl?.(path) ?? { data: { publicUrl: path } }
          ),
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      const state: Record<string, unknown> = { table }
      const builder: Record<string, any> = {
        data: null,
        error: null,
        select: (value: string) => {
          state.select = value
          const result = fromHandler(table, { ...state, op: state.op ?? 'select' })
          builder.data = result.data
          builder.error = result.error
          return builder
        },
        insert: (value: unknown) => {
          state.op = 'insert'
          state.insert = value
          const result = fromHandler(table, state)
          builder.data = result.data
          builder.error = result.error
          return builder
        },
        update: (value: unknown) => {
          state.op = 'update'
          state.update = value
          const result = fromHandler(table, state)
          builder.data = result.data
          builder.error = result.error
          return builder
        },
        upsert: (value: unknown) => {
          state.op = 'upsert'
          state.upsert = value
          const result = fromHandler(table, state)
          builder.data = result.data
          builder.error = result.error
          return Promise.resolve(result)
        },
        delete: () => {
          state.op = 'delete'
          const result = fromHandler(table, state)
          builder.data = result.data
          builder.error = result.error
          return builder
        },
        eq: (key: string, value: unknown) => {
          state[`eq:${key}`] = value
          return builder
        },
        in: (key: string, value: unknown) => {
          state[`in:${key}`] = value
          return builder
        },
        order: () => builder,
        single: () => Promise.resolve({ data: builder.data, error: builder.error }),
        maybeSingle: () => Promise.resolve({ data: builder.data, error: builder.error }),
      }
      return builder
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  redirectMock.mockReset()
})

describe('protected actions', () => {
  it('redirects unauthenticated create item requests', async () => {
    redirectMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: null,
        fromHandler: () => success(null),
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com')

    await expect(createItemDraftAction(formData)).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/auth/login')
  })

  it('creates partner and redirects to partner route', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'partners' && state.op === 'insert') {
            return success({ id: 3, slug: 'acme' })
          }
          if (table === 'partner_members' && state.op === 'insert') {
            return failure('duplicate', '23505')
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('title', 'Acme Corp')

    await createPartnerAction(formData)
    expect(revalidatePathMock).toHaveBeenCalledWith('/protected')
    expect(redirectMock).toHaveBeenCalledWith('/protected/acme')
  })

  it('updates partner settings and redirects to settings page', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'partners' && state.op === 'update') {
            return success(null)
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '3')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'Acme Updated')
    formData.set('description', 'Desc')

    await updatePartnerAction(formData)
    expect(redirectMock).toHaveBeenCalledWith('/protected/acme/settings')
  })

  it('adds partner member and normalizes non-admin role to member', async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        rpc: rpcSpy,
        fromHandler: () => success(null),
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '3')
    formData.set('partnerSlug', 'acme')
    formData.set('email', 'new@example.com')
    formData.set('role', 'viewer')

    await addPartnerMemberAction(formData)
    expect(rpcSpy).toHaveBeenCalledWith('add_partner_member', {
      target_partner_id: 3,
      target_email: 'new@example.com',
      target_role: 'member',
    })
  })

  it('creates oauth item and review row when requesting review', async () => {
    const upsertSpy = vi.fn()
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'insert') {
            return success({ id: 10, slug: 'oauth-item' })
          }
          if (table === 'item_reviews' && state.op === 'upsert') {
            upsertSpy(state.upsert)
            return success(null)
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'OAuth Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com/listing')
    formData.set('intent', 'request_review')

    const result = await createItemDraftAction(formData)
    expect(result).toEqual({ itemId: 10, itemSlug: 'oauth-item', partnerSlug: 'acme' })
    expect(upsertSpy).toHaveBeenCalled()
  })

  it('creates template item and updates registry URL from uploaded package', async () => {
    jsZipLoadAsyncMock.mockResolvedValue({
      files: {
        'pkg/template.json': {
          dir: false,
          name: 'pkg/template.json',
          async: vi.fn().mockResolvedValue(new Blob(['{}'], { type: 'application/json' })),
        },
        'pkg/functions/main.ts': {
          dir: false,
          name: 'pkg/functions/main.ts',
          async: vi.fn().mockResolvedValue(new Blob(['export {}'], { type: 'text/plain' })),
        },
        'pkg/schemas/001.sql': {
          dir: false,
          name: 'pkg/schemas/001.sql',
          async: vi.fn().mockResolvedValue(new Blob(['select 1;'], { type: 'text/plain' })),
        },
      },
    })

    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        storage: {
          list: vi.fn().mockResolvedValue(success([])),
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/template.json' } }),
        },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'insert') {
            return success({ id: 20, slug: 'template-item' })
          }
          if (table === 'items' && state.op === 'update') {
            return success(null)
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    const templateZip = new File(['zip'], 'template.zip', { type: 'application/zip' })
    ;(templateZip as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = vi
      .fn()
      .mockResolvedValue(new ArrayBuffer(8))
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'Template Item')
    formData.set('type', 'template')
    formData.set('templateZip', templateZip)

    const result = await createItemDraftAction(formData)
    expect(result).toEqual({ itemId: 20, itemSlug: 'template-item', partnerSlug: 'acme' })
  })

  it('creates template drafts without a template package', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'insert') {
            return success({ id: 21, slug: 'draft-template' })
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'Draft Template')
    formData.set('type', 'template')

    const result = await createItemDraftAction(formData)
    expect(result).toEqual({ itemId: 21, itemSlug: 'draft-template', partnerSlug: 'acme' })
  })

  it('throws when template item review upsert fails', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'insert') {
            return success({ id: 10, slug: 'oauth-item' })
          }
          if (table === 'item_reviews' && state.op === 'upsert') {
            return failure('review upsert failed')
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'OAuth Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com/listing')
    formData.set('intent', 'request_review')

    await expect(createItemDraftAction(formData)).rejects.toThrow('review upsert failed')
  })

  it('redirects after create item action wrapper', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'insert') {
            return success({ id: 10, slug: 'oauth-item' })
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('title', 'OAuth Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com/listing')

    await createItemAction(formData)
    expect(redirectMock).toHaveBeenCalledWith('/protected/acme/items/oauth-item')
  })

  it('does not upsert review when current status is draft', async () => {
    const upsertSpy = vi.fn()
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'select') {
            return success({ type: 'oauth', registry_item_url: null, url: 'https://example.com' })
          }
          if (table === 'item_reviews' && state.op === 'select') {
            return success({ status: 'draft' })
          }
          if (table === 'item_reviews' && state.op === 'upsert') {
            upsertSpy()
            return success(null)
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '7')
    formData.set('itemSlug', 'my-item')
    formData.set('partnerSlug', 'acme')

    await requestItemReviewAction(formData)
    expect(upsertSpy).not.toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/protected/acme/items/my-item')
  })

  it('rejects invalid review statuses', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: () => success(null),
      })
    )

    const formData = new FormData()
    formData.set('itemId', '9')
    formData.set('partnerSlug', 'acme')
    formData.set('status', 'invalid_status')

    await expect(saveItemReviewAction(formData)).rejects.toThrow('Invalid review status')
  })

  it('deletes removed files during item update', async () => {
    const storageRemoveSpy = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'update') {
            return success({ slug: 'updated-item' })
          }
          if (table === 'item_files' && state.op === 'select') {
            return success([{ id: 99, file_path: '1/items/2/files/a.png' }])
          }
          if (table === 'item_files' && state.op === 'delete') {
            return success(null)
          }
          return success(null)
        },
        storage: {
          remove: storageRemoveSpy,
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '2')
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('name', 'Updated Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com')
    formData.append('removedFileIds[]', '99')

    const result = await updateItemDraftAction(formData)
    expect(result).toEqual({ itemId: 2, itemSlug: 'updated-item', partnerSlug: 'acme' })
    expect(storageRemoveSpy).toHaveBeenCalledWith(['1/items/2/files/a.png'])
  })

  it('throws when storage file deletion fails during item update', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'update') {
            return success({ slug: 'updated-item' })
          }
          if (table === 'item_files' && state.op === 'select') {
            return success([{ id: 99, file_path: '1/items/2/files/a.png' }])
          }
          return success(null)
        },
        storage: {
          remove: vi.fn().mockResolvedValue({ error: { message: 'storage delete failed' } }),
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '2')
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('name', 'Updated Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com')
    formData.append('removedFileIds[]', '99')

    await expect(updateItemDraftAction(formData)).rejects.toThrow('storage delete failed')
  })

  it('throws when row deletion fails during item update', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'update') {
            return success({ slug: 'updated-item' })
          }
          if (table === 'item_files' && state.op === 'select') {
            return success([{ id: 99, file_path: '1/items/2/files/a.png' }])
          }
          if (table === 'item_files' && state.op === 'delete') {
            return failure('row delete failed')
          }
          return success(null)
        },
        storage: {
          remove: vi.fn().mockResolvedValue({ error: null }),
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '2')
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('name', 'Updated Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com')
    formData.append('removedFileIds[]', '99')

    await expect(updateItemDraftAction(formData)).rejects.toThrow('row delete failed')
  })

  it('redirects after update item action wrapper', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'user-1' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'update') {
            return success({ slug: 'updated-item' })
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '2')
    formData.set('partnerId', '1')
    formData.set('partnerSlug', 'acme')
    formData.set('name', 'Updated Item')
    formData.set('type', 'oauth')
    formData.set('url', 'https://example.com')

    await updateItemAction(formData)
    expect(redirectMock).toHaveBeenCalledWith('/protected/acme/items/updated-item')
  })

  it('throws when fetching existing review fails', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'select') {
            return success({ type: 'oauth', registry_item_url: null, url: 'https://example.com' })
          }
          if (table === 'item_reviews' && state.op === 'select') {
            return failure('existing review query failed')
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '7')
    formData.set('itemSlug', 'my-item')
    formData.set('partnerSlug', 'acme')

    await expect(requestItemReviewAction(formData)).rejects.toThrow('existing review query failed')
  })

  it('rejects template review requests when no template package has been uploaded', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'select') {
            return success({ type: 'template', registry_item_url: null, url: null })
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '7')
    formData.set('itemSlug', 'my-item')
    formData.set('partnerSlug', 'acme')

    await expect(requestItemReviewAction(formData)).rejects.toThrow(
      'Template items require a template ZIP package before publishing or requesting review'
    )
  })

  it('throws when request-review upsert fails', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: (table, state) => {
          if (table === 'items' && state.op === 'select') {
            return success({ type: 'oauth', registry_item_url: null, url: 'https://example.com' })
          }
          if (table === 'item_reviews' && state.op === 'select') {
            return success({ status: 'rejected' })
          }
          if (table === 'item_reviews' && state.op === 'upsert') {
            return failure('upsert failed')
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '7')
    formData.set('itemSlug', 'my-item')
    formData.set('partnerSlug', 'acme')

    await expect(requestItemReviewAction(formData)).rejects.toThrow('upsert failed')
  })

  it('throws when save review upsert fails', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: (table, state) => {
          if (table === 'item_reviews' && state.op === 'upsert') {
            return failure('save review failed')
          }
          return success(null)
        },
      })
    )

    const formData = new FormData()
    formData.set('itemId', '9')
    formData.set('partnerSlug', 'acme')
    formData.set('status', 'approved')
    formData.set('reviewNotes', 'ok')

    await expect(saveItemReviewAction(formData)).rejects.toThrow('save review failed')
  })

  it('redirects after update item review action wrapper', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        user: { id: 'reviewer' },
        fromHandler: () => success(null),
      })
    )

    const formData = new FormData()
    formData.set('itemId', '9')
    formData.set('partnerSlug', 'acme')
    formData.set('status', 'approved')
    formData.set('reviewNotes', 'ok')

    await updateItemReviewAction(formData)
    expect(redirectMock).toHaveBeenCalledWith('/protected/acme/reviews/9')
  })
})
