import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const redirectMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}))

import {
  createItemDraftAction,
  createPartnerAction,
  requestItemReviewAction,
  saveItemReviewAction,
} from '@/app/protected/actions'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('marketplace flow smoke', () => {
  it('covers partner -> item -> request review -> reviewer decision', async () => {
    const upsertCalls: unknown[] = []

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@b.com' } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        const chain = {
          data: null as unknown,
          error: null as null | { message: string },
          insert(value: unknown) {
            if (table === 'partners') chain.data = { id: 1, slug: 'acme' }
            if (table === 'items') chain.data = { id: 5, slug: 'auth-item' }
            return chain
          },
          upsert(value: unknown) {
            upsertCalls.push({ table, value })
            return Promise.resolve({ data: null, error: null })
          },
          update() {
            chain.data = { slug: 'auth-item' }
            return chain
          },
          select() {
            if (table === 'item_reviews') {
              chain.data = { status: 'rejected' }
            }
            return chain
          },
          eq() {
            return chain
          },
          in() {
            return chain
          },
          maybeSingle() {
            return Promise.resolve({ data: chain.data, error: null })
          },
          single() {
            return Promise.resolve({ data: chain.data, error: null })
          },
        }
        return chain
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
          remove: vi.fn().mockResolvedValue({ error: null }),
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/registry' } }),
        }),
      },
      rpc: vi.fn().mockResolvedValue({ error: null }),
    })

    const partnerForm = new FormData()
    partnerForm.set('title', 'Acme')
    await createPartnerAction(partnerForm)

    const itemForm = new FormData()
    itemForm.set('partnerId', '1')
    itemForm.set('partnerSlug', 'acme')
    itemForm.set('title', 'Auth Item')
    itemForm.set('type', 'oauth')
    itemForm.set('url', 'https://example.com/listing')
    itemForm.set('intent', 'request_review')
    const created = await createItemDraftAction(itemForm)

    const requestForm = new FormData()
    requestForm.set('itemId', String(created.itemId))
    requestForm.set('itemSlug', created.itemSlug)
    requestForm.set('partnerSlug', created.partnerSlug)
    await requestItemReviewAction(requestForm)

    const reviewerForm = new FormData()
    reviewerForm.set('itemId', String(created.itemId))
    reviewerForm.set('partnerSlug', created.partnerSlug)
    reviewerForm.set('status', 'approved')
    reviewerForm.set('reviewNotes', 'Ship it')
    reviewerForm.set('featured', 'on')
    await saveItemReviewAction(reviewerForm)

    expect(upsertCalls.length).toBeGreaterThan(0)
    expect(redirectMock).toHaveBeenCalled()
  })
})
