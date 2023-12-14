import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let ipAddress = req.headers['x-real-ip'] as string

  const forwardedFor = req.headers['x-forwarded-for'] as string
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string
  if (!ipAddress && forwardedFor) {
    ipAddress = forwardedFor?.split(',').at(0) ?? 'Unknown'
  }

  return res.status(200).json({ ipAddress, forwardedFor, cfConnectingIp })
}

export default handler
