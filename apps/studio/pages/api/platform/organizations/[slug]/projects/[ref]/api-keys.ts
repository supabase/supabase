import { apiBuilder } from '../../../../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from '../../../../../../../data/vela/vela'
import { IS_VELA_PLATFORM } from 'lib/constants'

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    const response = [
      {
        name: 'anon',
        api_key: process.env.SUPABASE_ANON_KEY ?? '',
        id: 'anon',
        type: 'legacy',
        hash: '',
        prefix: '',
        description: 'Legacy anon API key',
      },
      {
        name: 'service_role',
        api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
        id: 'service_role',
        type: 'legacy',
        hash: '',
        prefix: '',
        description: 'Legacy service_role API key',
      },
    ]
    return res.status(200).json(response)
  }

  const { slug, ref } = req.query
  const client = getVelaClient(req)

}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGetAll))

export default apiHandler