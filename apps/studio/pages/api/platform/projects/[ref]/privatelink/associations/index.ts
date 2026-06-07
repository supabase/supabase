import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] AWS PrivateLink account allowlist for a project. Maps our
// control-plane accounts to the dashboard's private_link_associations shape.
// (Endpoint-service provisioning is deferred; this is the account allowlist.)
const STATUS_MAP: Record<string, string> = { pending: 'CREATING', active: 'READY' }

export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<{ accounts?: Array<{ id: string; awsAccountId: string; status: string }> }>(
      req,
      `/api/v1/projects/${ref}/privatelink/accounts`
    )
    const associations = (data?.accounts ?? []).map((a) => ({
      aws_account_id: a.awsAccountId,
      account_name: undefined,
      status: STATUS_MAP[a.status] ?? 'CREATING',
      shared_at: null,
    }))
    return res.status(200).json({ private_link_associations: associations })
  },
})
