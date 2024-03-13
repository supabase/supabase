import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let ipAddress = req.headers['x-real-ip'] as string

  const forwardedFor = req.headers['x-forwarded-for'] as string

  // With CF infront, the user IP will be in this header instead of the x-forwared-for
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string
  if (cfConnectingIp) {
    ipAddress = cfConnectingIp.split(',').at(0) ?? 'Unknown'
  } else if (!ipAddress && forwardedFor) {
    ipAddress = forwardedFor.split(',').at(0) ?? 'Unknown'
  }

  return res.status(200).json({ ipAddress })
}

export default handler
