import { bff, consoleFetch, getFullOrg, resolveOrg, ROLE_NAME_TO_ID } from '@/lib/console-bff'

// role_id -> better-auth role name (reverse of ROLE_NAME_TO_ID).
const ROLE_ID_TO_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(ROLE_NAME_TO_ID).map(([name, id]) => [id, name])
)

// [console fork] Update / remove a member's org role.
// PUT  -> set the member's role (studio sends role_id in the path)
// DELETE -> no-op unassign (single-role model; role is set via PUT)
export default bff({
  PUT: async (req, res) => {
    const slug = String(req.query.slug ?? '')
    const userId = String(req.query.gotrue_id ?? '')
    const roleId = Number(req.query.role_id)
    const role = ROLE_ID_TO_NAME[roleId]
    if (!role) return res.status(400).json({ error: { message: `Unknown role id ${roleId}` } })

    const org = await resolveOrg(req, slug)
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    // better-auth updates by member id, not user id — resolve it from the full org.
    const full = await getFullOrg(req, slug)
    const member = (full?.members ?? []).find((m: any) => m.userId === userId)
    if (!member) return res.status(404).json({ error: { message: 'Member not found' } })

    const { ok, status, data } = await consoleFetch<any>(
      req,
      `/api/auth/organization/update-member-role`,
      {
        method: 'POST',
        body: JSON.stringify({ memberId: member.id, role, organizationId: org.id }),
      }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to update member role' } })
    }
    return res.status(200).json({ gotrue_id: userId, role_ids: [roleId] })
  },

  DELETE: async (req, res) => {
    // Single-role model: unassigning is handled by assigning a new role via PUT.
    return res.status(200).json({ gotrue_id: String(req.query.gotrue_id ?? '') })
  },
})
