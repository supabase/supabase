import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Merge a preview branch into production. Needs migration tooling;
// the control-plane responds 501 until implemented. Proxied so the dashboard shows
// a clear message rather than a generic failure.
export default bff({
  POST: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { status, data } = await consoleFetch(req, `/api/v1/branches/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    return res
      .status(status && status >= 400 ? status : 501)
      .json({ message: (data as any)?.message ?? 'Branch merge is not yet supported on self-host' })
  },
})
