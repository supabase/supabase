import { bff, consoleGet, consoleFetch } from '@/lib/console-bff'

// [console fork] Scoped personal access tokens (apiKey plugin + scopes in metadata).
export default bff({
  GET: async (req, res) => {
    const { data } = await consoleGet<any>(req, `/api/v1/account/scoped-access-tokens`)
    return res.status(200).json(data ?? [])
  },
  POST: async (req, res) => {
    const { ok, status, data } = await consoleFetch(req, `/api/v1/account/scoped-access-tokens`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to create token' } })
    }
    return res.status(201).json(data ?? {})
  },
})
