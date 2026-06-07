import { bff, consoleFetch, consoleGet } from '@/lib/console-bff'

// [console fork] Remove an AWS account from a project's PrivateLink allowlist.
// The dashboard deletes by aws_account_id; our control-plane deletes by row id, so
// resolve the id first.
export default bff({
  DELETE: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const awsAccountId = String(req.query.aws_account_id ?? '')
    const { data } = await consoleGet<{ accounts?: Array<{ id: string; awsAccountId: string }> }>(
      req,
      `/api/v1/projects/${ref}/privatelink/accounts`
    )
    const row = (data?.accounts ?? []).find((a) => a.awsAccountId === awsAccountId)
    if (!row) return res.status(200).json({ ok: true })
    const { ok, status, data: del } = await consoleFetch(
      req,
      `/api/v1/projects/${ref}/privatelink/accounts/${row.id}`,
      { method: 'DELETE' }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (del as any)?.message ?? 'Failed to remove AWS account' } })
    }
    return res.status(200).json(del ?? { ok: true })
  },
})
