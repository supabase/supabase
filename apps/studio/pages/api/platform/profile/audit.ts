import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

const handleGet = (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    result: [],
    retention_period: 0
  }) // FIXME: missing implementation
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
