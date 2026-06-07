import { bff, getFullOrg, ROLE_NAME_TO_ID } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/members -> better-auth full org members.
export default bff({
  GET: async (req, res) => {
    const org = await getFullOrg(req, String(req.query.slug ?? ''))
    const members = Array.isArray(org?.members) ? org.members : []
    return res.status(200).json(
      members.map((m: any) => ({
        gotrue_id: m.userId,
        primary_email: m.user?.email ?? '',
        username: m.user?.name ?? m.user?.email?.split('@')[0] ?? '',
        mfa_enabled: false,
        role_ids: [ROLE_NAME_TO_ID[m.role] ?? 3],
      }))
    )
  },
})
