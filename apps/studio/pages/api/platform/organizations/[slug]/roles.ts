import { bff, ORG_ROLES } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/roles -> our fixed org roles.
export default bff({
  GET: async (_req, res) =>
    res.status(200).json({ org_scoped_roles: ORG_ROLES, project_scoped_roles: [] }),
})
