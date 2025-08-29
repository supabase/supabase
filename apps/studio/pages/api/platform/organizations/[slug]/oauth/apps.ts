import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../../lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json([])
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
