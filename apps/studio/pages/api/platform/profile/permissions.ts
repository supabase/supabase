import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../lib/api/apiBuilder'
import { PermissionAction } from '@supabase/shared-types/out/constants'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(req.body)

  return res.status(200).json([{
    actions: [PermissionAction.CREATE, PermissionAction.TENANT_SQL_ADMIN_WRITE],
    condition: true,
    organization_slug: 'foo-org',
    resources: ['projects'],
    project_refs: []
  }])
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
