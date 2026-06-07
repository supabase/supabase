import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Add an AWS account to a project's PrivateLink allowlist.
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const awsAccountId = String(req.body?.aws_account_id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/privatelink/accounts`, {
      method: 'POST',
      body: JSON.stringify({ awsAccountId }),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to add AWS account' } })
    }
    return res.status(201).json(data)
  },
})
