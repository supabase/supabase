import { bff } from '@/lib/console-bff'
import { getFullOrg } from '@/lib/console-bff'

// [console fork] Single organization detail. Proxies + maps the control-plane org.
export default bff({
  GET: async (req, res) => {
    const slug = String(req.query.slug ?? '')
    const org = await getFullOrg(req, slug)
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    return res.status(200).json(org)
  },
})
