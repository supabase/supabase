import { apiBuilder } from '../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

const handlePost = (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({}) // FIXME: implement for real
}

const apiHandler = apiBuilder(builder => builder.post(handlePost))

export default apiHandler
