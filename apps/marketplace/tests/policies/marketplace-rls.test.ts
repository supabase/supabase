import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY

const hasRequiredEnv = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && SERVICE_ROLE_KEY)
const describeIfConfigured = hasRequiredEnv ? describe : describe.skip

const RUN_ID = crypto.randomUUID().slice(0, 8)

const PARTNER_USER_ID = crypto.randomUUID()
const OTHER_PARTNER_USER_ID = crypto.randomUUID()
const REVIEWER_USER_ID = crypto.randomUUID()

const PARTNER_EMAIL = `partner-${RUN_ID}@test.local`
const OTHER_PARTNER_EMAIL = `other-partner-${RUN_ID}@test.local`
const REVIEWER_EMAIL = `reviewer-${RUN_ID}@test.local`
const PASSWORD = 'password123'

const PARTNER_SLUG = `partner-${RUN_ID}`
const OTHER_PARTNER_SLUG = `other-${RUN_ID}`
const REVIEWER_PARTNER_SLUG = `reviewers-${RUN_ID}`

let partnerId: number
let otherPartnerId: number
let reviewerPartnerId: number
let partnerItemId: number
let otherPartnerItemId: number
let partnerDraftItemId: number

const admin = hasRequiredEnv
  ? createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

const partnerClient = hasRequiredEnv
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

const otherPartnerClient = hasRequiredEnv
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

const reviewerClient = hasRequiredEnv
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

const publicClient = hasRequiredEnv
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

async function signIn(
  client: NonNullable<typeof partnerClient>,
  email: string,
  password: string
) {
  const { error } = await client.auth.signInWithPassword({ email, password })
  expect(error).toBeNull()
}

describeIfConfigured('Marketplace RLS policies', () => {
  beforeAll(async () => {
    const adminClient = admin!

    await Promise.all([
      adminClient.auth.admin.createUser({
        id: PARTNER_USER_ID,
        email: PARTNER_EMAIL,
        password: PASSWORD,
        email_confirm: true,
      }),
      adminClient.auth.admin.createUser({
        id: OTHER_PARTNER_USER_ID,
        email: OTHER_PARTNER_EMAIL,
        password: PASSWORD,
        email_confirm: true,
      }),
      adminClient.auth.admin.createUser({
        id: REVIEWER_USER_ID,
        email: REVIEWER_EMAIL,
        password: PASSWORD,
        email_confirm: true,
      }),
    ])

    const { data: partnerRows, error: partnerInsertError } = await adminClient
      .from('partners')
      .insert([
        {
          slug: PARTNER_SLUG,
          title: 'Partner Under Test',
          role: 'partner',
          created_by: PARTNER_USER_ID,
        },
        {
          slug: OTHER_PARTNER_SLUG,
          title: 'Other Partner Under Test',
          role: 'partner',
          created_by: OTHER_PARTNER_USER_ID,
        },
        {
          slug: REVIEWER_PARTNER_SLUG,
          title: 'Reviewer Org Under Test',
          role: 'reviewer',
          created_by: REVIEWER_USER_ID,
        },
      ])
      .select('id, slug')

    expect(partnerInsertError).toBeNull()
    expect(partnerRows).toBeDefined()

    const partnersBySlug = new Map(partnerRows!.map((row) => [row.slug, row.id]))
    partnerId = partnersBySlug.get(PARTNER_SLUG)!
    otherPartnerId = partnersBySlug.get(OTHER_PARTNER_SLUG)!
    reviewerPartnerId = partnersBySlug.get(REVIEWER_PARTNER_SLUG)!

    const { error: memberInsertError } = await adminClient.from('partner_members').insert([
      {
        partner_id: partnerId,
        user_id: PARTNER_USER_ID,
        role: 'admin',
      },
      {
        partner_id: otherPartnerId,
        user_id: OTHER_PARTNER_USER_ID,
        role: 'admin',
      },
      {
        partner_id: reviewerPartnerId,
        user_id: REVIEWER_USER_ID,
        role: 'admin',
      },
    ])
    expect(memberInsertError).toBeNull()

    const { data: itemRows, error: itemInsertError } = await adminClient
      .from('items')
      .insert([
        {
          partner_id: partnerId,
          slug: `partner-item-${RUN_ID}`,
          title: 'Partner Visible Item',
          type: 'oauth',
          url: 'https://example.com/partner',
          submitted_by: PARTNER_USER_ID,
        },
        {
          partner_id: otherPartnerId,
          slug: `other-partner-item-${RUN_ID}`,
          title: 'Other Partner Item',
          type: 'oauth',
          url: 'https://example.com/other',
          submitted_by: OTHER_PARTNER_USER_ID,
        },
      ])
      .select('id, partner_id')

    expect(itemInsertError).toBeNull()
    expect(itemRows).toHaveLength(2)

    const ownItem = itemRows!.find((row) => row.partner_id === partnerId)
    const foreignItem = itemRows!.find((row) => row.partner_id === otherPartnerId)
    partnerItemId = ownItem!.id
    otherPartnerItemId = foreignItem!.id

    const { error: reviewInsertError } = await adminClient.from('item_reviews').insert({
      item_id: partnerItemId,
      status: 'pending_review',
      featured: false,
    })
    expect(reviewInsertError).toBeNull()

    const { error: fileInsertError } = await adminClient.from('item_files').insert([
      {
        item_id: partnerItemId,
        file_path: `${partnerId}/items/${partnerItemId}/preview.png`,
        sort_order: 0,
      },
      {
        item_id: otherPartnerItemId,
        file_path: `${otherPartnerId}/items/${otherPartnerItemId}/preview.png`,
        sort_order: 0,
      },
    ])
    expect(fileInsertError).toBeNull()

    await Promise.all([
      signIn(partnerClient!, PARTNER_EMAIL, PASSWORD),
      signIn(otherPartnerClient!, OTHER_PARTNER_EMAIL, PASSWORD),
      signIn(reviewerClient!, REVIEWER_EMAIL, PASSWORD),
    ])
  })

  afterAll(async () => {
    if (!admin) return

    await admin
      .from('item_reviews')
      .delete()
      .in('item_id', [partnerItemId, otherPartnerItemId, partnerDraftItemId].filter(Boolean))

    await admin
      .from('items')
      .delete()
      .in('id', [partnerItemId, otherPartnerItemId, partnerDraftItemId].filter(Boolean))

    await admin
      .from('partner_members')
      .delete()
      .in('user_id', [PARTNER_USER_ID, OTHER_PARTNER_USER_ID, REVIEWER_USER_ID])

    await admin.from('partners').delete().in('id', [partnerId, otherPartnerId, reviewerPartnerId].filter(Boolean))

    await Promise.all([
      admin.auth.admin.deleteUser(PARTNER_USER_ID),
      admin.auth.admin.deleteUser(OTHER_PARTNER_USER_ID),
      admin.auth.admin.deleteUser(REVIEWER_USER_ID),
    ])
  })

  it('allows partners to read only their own items', async () => {
    const { data, error } = await partnerClient!.from('items').select('id, partner_id')

    expect(error).toBeNull()
    expect(data?.some((item) => item.id === partnerItemId)).toBe(true)
    expect(data?.some((item) => item.id === otherPartnerItemId)).toBe(false)
  })

  it('blocks partner item inserts for a different partner', async () => {
    const { error } = await partnerClient!.from('items').insert({
      partner_id: otherPartnerId,
      slug: `blocked-cross-partner-${RUN_ID}`,
      title: 'Should Not Insert',
      type: 'oauth',
      url: 'https://example.com/blocked',
      submitted_by: PARTNER_USER_ID,
    })

    expect(error).not.toBeNull()
  })

  it('allows partner inserts only with own submitted_by', async () => {
    const { data: ownInsertData, error: ownInsertError } = await partnerClient!
      .from('items')
      .insert({
        partner_id: partnerId,
        slug: `allowed-own-item-${RUN_ID}`,
        title: 'Own Partner Insert',
        type: 'oauth',
        url: 'https://example.com/own',
        submitted_by: PARTNER_USER_ID,
      })
      .select('id')
      .single()

    expect(ownInsertError).toBeNull()
    expect(ownInsertData).toBeDefined()
    partnerDraftItemId = ownInsertData!.id

    const { error: spoofedSubmitterError } = await partnerClient!.from('items').insert({
      partner_id: partnerId,
      slug: `blocked-submitter-spoof-${RUN_ID}`,
      title: 'Spoofed Submitter',
      type: 'oauth',
      url: 'https://example.com/spoof',
      submitted_by: OTHER_PARTNER_USER_ID,
    })

    expect(spoofedSubmitterError).not.toBeNull()
  })

  it('allows partner review requests only as pending_review', async () => {
    const { error: blockedError } = await partnerClient!.from('item_reviews').insert({
      item_id: partnerDraftItemId,
      status: 'approved',
      featured: true,
      reviewed_by: PARTNER_USER_ID,
    })
    expect(blockedError).not.toBeNull()

    const { error: allowedError } = await partnerClient!.from('item_reviews').insert({
      item_id: partnerDraftItemId,
      status: 'pending_review',
      featured: false,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      published_at: null,
    })
    expect(allowedError).toBeNull()
  })

  it('prevents partners from approving reviews and allows reviewer approval', async () => {
    const { error: partnerUpdateError } = await partnerClient!
      .from('item_reviews')
      .update({
        status: 'approved',
        review_notes: 'Partner attempted approval',
        reviewed_by: PARTNER_USER_ID,
      })
      .eq('item_id', partnerItemId)

    expect(partnerUpdateError).toBeNull()

    const { data: afterPartnerAttempt, error: afterPartnerAttemptError } = await admin!
      .from('item_reviews')
      .select('status, reviewed_by')
      .eq('item_id', partnerItemId)
      .single()

    expect(afterPartnerAttemptError).toBeNull()
    expect(afterPartnerAttempt?.status).toBe('pending_review')
    expect(afterPartnerAttempt?.reviewed_by).toBeNull()

    const { error: reviewerUpdateError } = await reviewerClient!
      .from('item_reviews')
      .update({
        status: 'approved',
        featured: true,
        reviewed_by: REVIEWER_USER_ID,
        review_notes: 'Approved by reviewer',
      })
      .eq('item_id', partnerItemId)

    expect(reviewerUpdateError).toBeNull()

    const { data: finalReview, error: finalReviewError } = await admin!
      .from('item_reviews')
      .select('status, reviewed_by, featured')
      .eq('item_id', partnerItemId)
      .single()

    expect(finalReviewError).toBeNull()
    expect(finalReview?.status).toBe('approved')
    expect(finalReview?.reviewed_by).toBe(REVIEWER_USER_ID)
    expect(finalReview?.featured).toBe(true)
  })

  it('allows anonymous reads only for published items with latest approved review', async () => {
    const { error: pendingSetupError } = await admin!
      .from('items')
      .update({ published: true })
      .eq('id', partnerItemId)
    expect(pendingSetupError).toBeNull()

    const { error: pendingReviewError } = await admin!
      .from('item_reviews')
      .update({
        status: 'pending_review',
        reviewed_by: REVIEWER_USER_ID,
      })
      .eq('item_id', partnerItemId)
    expect(pendingReviewError).toBeNull()

    const { data: pendingItems, error: pendingItemsError } = await publicClient!
      .from('items')
      .select('id')
      .eq('id', partnerItemId)
    expect(pendingItemsError).toBeNull()
    expect(pendingItems).toHaveLength(0)

    const { data: pendingFiles, error: pendingFilesError } = await publicClient!
      .from('item_files')
      .select('id')
      .eq('item_id', partnerItemId)
    expect(pendingFilesError).toBeNull()
    expect(pendingFiles).toHaveLength(0)

    const { error: approvedReviewError } = await admin!
      .from('item_reviews')
      .update({
        status: 'approved',
        reviewed_by: REVIEWER_USER_ID,
      })
      .eq('item_id', partnerItemId)
    expect(approvedReviewError).toBeNull()

    const { data: approvedItems, error: approvedItemsError } = await publicClient!
      .from('items')
      .select('id')
      .eq('id', partnerItemId)
    expect(approvedItemsError).toBeNull()
    expect(approvedItems).toHaveLength(1)

    const { data: approvedFiles, error: approvedFilesError } = await publicClient!
      .from('item_files')
      .select('id')
      .eq('item_id', partnerItemId)
    expect(approvedFilesError).toBeNull()
    expect(approvedFiles).toHaveLength(1)

    const { error: unpublishedSetupError } = await admin!
      .from('items')
      .update({ published: false })
      .eq('id', partnerItemId)
    expect(unpublishedSetupError).toBeNull()

    const { data: unpublishedItems, error: unpublishedItemsError } = await publicClient!
      .from('items')
      .select('id')
      .eq('id', partnerItemId)
    expect(unpublishedItemsError).toBeNull()
    expect(unpublishedItems).toHaveLength(0)

    const { data: unpublishedFiles, error: unpublishedFilesError } = await publicClient!
      .from('item_files')
      .select('id')
      .eq('item_id', partnerItemId)
    expect(unpublishedFilesError).toBeNull()
    expect(unpublishedFiles).toHaveLength(0)
  })
})
