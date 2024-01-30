import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref, tld } = req.query
  try {
    // [Joshen] Additional safety checks on project ref just to be sure
    if ((ref ?? '').length !== 20 || !/^[a-zA-Z]+$/.test(ref as string)) {
      throw new Error('Invalid project ref')
    }
    if (!['co', 'red'].includes(tld as string)) {
      throw new Error('Invalid TLD')
    }

    const host = `db.${ref}.supabase.${tld}`
    const url = `http://${host}:6543`
    await fetch(url)
  } catch (error) {
    // the response is text which make fetch fail because it's trying to parse it as JSON. But if there's a response,
    // it means the pgBouncer is still active
    if ((error as any).cause.data) {
      return res.status(200).json(true)
    }
  }

  return res.status(200).json(false)
}
