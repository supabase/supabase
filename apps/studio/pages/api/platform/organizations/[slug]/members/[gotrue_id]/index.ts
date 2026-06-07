import { bff, consoleFetch, getFullOrg, resolveOrg, ROLE_NAME_TO_ID } from '@/lib/console-bff'

const ROLE_ID_TO_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(ROLE_NAME_TO_ID).map(([name, id]) => [id, name])
)

async function setMemberRole(req: any, res: any, roleId: number) {
  const slug = String(req.query.slug ?? '')
  const userId = String(req.query.gotrue_id ?? '')
  const role = ROLE_ID_TO_NAME[roleId]
  if (!role) return res.status(400).json({ error: { message: `Unknown role id ${roleId}` } })

  const org = await resolveOrg(req, slug)
  if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

  const full = await getFullOrg(req, slug)
  const member = (full?.members ?? []).find((m: any) => m.userId === userId)
  if (!member) return res.status(404).json({ error: { message: 'Member not found' } })

  const { ok, status, data } = await consoleFetch<any>(
    req,
    `/api/auth/organization/update-member-role`,
    { method: 'POST', body: JSON.stringify({ memberId: member.id, role, organizationId: org.id }) }
  )
  if (!ok) {
    return res
      .status(status && status >= 400 ? status : 502)
      .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to update member role' } })
  }
  return res.status(200).json({ gotrue_id: userId, role_ids: [roleId] })
}

// [console fork] Member-level org operations.
// PATCH (assign role, "Manage access") and PUT both set the member's single role.
export default bff({
  PATCH: async (req, res) => setMemberRole(req, res, Number((req.body ?? {}).role_id)),
  PUT: async (req, res) => setMemberRole(req, res, Number((req.body ?? {}).role_id)),
})
