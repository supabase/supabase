import { apiBuilder } from '../../../../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { IS_VELA_PLATFORM } from '../../../../../constants'
import { getVelaClient } from '../../../../../../../data/vela/vela'

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    return res.status(200).json([])
  }

  const { slug, ref } = req.query
  const client = getVelaClient(req)

}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGetAll))

export default apiHandler