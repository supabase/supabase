import { NextApiRequest, NextApiResponse } from 'next'

const accessKey = process.env.S3_PROTOCOL_ACCESS_KEY_ID
const secretKey = process.env.S3_PROTOCOL_ACCESS_KEY_SECRET

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({ accessKey: accessKey, secretKey })
}

export default handler
