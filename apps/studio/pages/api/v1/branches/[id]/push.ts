import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Push migrations from a preview branch. Needs migration tooling +
// GitHub; control-plane responds 501 until implemented.
export default bff({
  POST: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { status, data } = await consoleFetch(req, `/api/v1/branches/${id}/push`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    return res
      .status(status && status >= 400 ? status : 501)
      .json({ message: (data as any)?.message ?? 'Branch push is not yet supported on self-host' })
  },
})
