import { apiBuilder } from '../../../../../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json([])
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
