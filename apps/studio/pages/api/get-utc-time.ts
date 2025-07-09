import { NextApiRequest, NextApiResponse } from 'next'

// Returns the current UTC time in ISO format. Used to check if the client and server time are skewed. Clock skew causes
// issues with JWT verification.
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const utcTime = new Date().toISOString()

  return res.status(200).json({ utcTime })
}

export default handler
