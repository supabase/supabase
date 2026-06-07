import { bff, consoleGet, resolveOrg } from '@/lib/console-bff'

// [console fork] Reports whether this org has dedicated (BYO-AWS) infrastructure.
// When no AWS credentials are configured, only Shared Infrastructure is offered,
// so the project-create form hides the region + compute-size selectors.
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(200).json({ hasAwsCredentials: false, regions: [] })

    const { data: regions } = await consoleGet<{ regions: { id: string }[] }>(
      req,
      `/api/v1/organizations/${org.id}/regions`
    )
    const list = regions?.regions ?? []
    const hasAwsCredentials = list.some((r) => r.id !== 'shared')
    return res.status(200).json({ hasAwsCredentials, regions: list })
  },
})
