import { bff, getFullOrg, ROLE_NAME_TO_ID } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/members/invitations.
export default bff({
  GET: async (req, res) => {
    const org = await getFullOrg(req, String(req.query.slug ?? ''))
    const invitations = Array.isArray(org?.invitations) ? org.invitations : []
    return res.status(200).json({
      invitations: invitations
        .filter((i: any) => i.status === 'pending' || !i.status)
        .map((i: any) => ({
          id: i.id,
          invited_email: i.email,
          invited_at: i.createdAt ?? i.expiresAt ?? null,
          role_id: ROLE_NAME_TO_ID[i.role] ?? 3,
        })),
    })
  },
})
