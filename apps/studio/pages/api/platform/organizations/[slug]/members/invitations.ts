import { apiBuilder } from '../../../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { IS_VELA_PLATFORM } from '../../../../constants'
import { getVelaClient } from 'data/vela/vela'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    return res.status(200).json([])
  }

  const { slug } = req.query

  const client = getVelaClient(req)

  return res.status(200).json([])
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
