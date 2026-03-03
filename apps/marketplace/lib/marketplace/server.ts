import { createClient } from '@/lib/supabase/server'

export type PartnerSidebarData = {
  id: number
  slug: string
  title: string
  role: 'member' | 'admin'
  reviewer: boolean
  items: Array<{
    id: number
    slug: string
    title: string
  }>
}

export async function getMarketplaceSidebarData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      partners: [] as PartnerSidebarData[],
      isReviewerMember: false,
    }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('partner_members')
    .select('role, partner:partners(id, slug, title, reviewer)')
    .eq('user_id', user.id)

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  const partnerMap = new Map<number, PartnerSidebarData>()
  for (const entry of memberships ?? []) {
    const partnerValue = Array.isArray(entry.partner) ? entry.partner[0] : entry.partner
    const partner = partnerValue as
      | { id: number; slug: string; title: string; reviewer: boolean }
      | null
    if (!partner) continue
    partnerMap.set(partner.id, {
      id: partner.id,
      slug: partner.slug,
      title: partner.title,
      role: entry.role === 'admin' ? 'admin' : 'member',
      reviewer: partner.reviewer,
      items: [],
    })
  }

  const partnerIds = Array.from(partnerMap.keys())

  if (partnerIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, partner_id, slug, title')
      .in('partner_id', partnerIds)
      .order('title', { ascending: true })

    if (itemsError) {
      throw new Error(itemsError.message)
    }

    for (const item of items ?? []) {
      const partner = partnerMap.get(item.partner_id)
      if (!partner) continue
      partner.items.push({
        id: item.id,
        slug: item.slug,
        title: item.title,
      })
    }
  }

  const partners = Array.from(partnerMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  )
  const isReviewerMember = partners.some((partner) => partner.reviewer)
  return { user, partners, isReviewerMember }
}
