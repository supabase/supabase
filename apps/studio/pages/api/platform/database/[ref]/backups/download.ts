import { bff } from '@/lib/console-bff'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

// [console fork] Returns a same-origin URL the browser can download the logical
// backup (.dump) from; the actual bytes are streamed by `download-file` below.
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const id = String(req.body?.id ?? '')
    if (!id) return res.status(400).json({ error: { message: 'Backup id is required' } })
    return res
      .status(200)
      .json({ fileUrl: `${API}/platform/database/${ref}/backups/download-file?id=${encodeURIComponent(id)}` })
  },
})
