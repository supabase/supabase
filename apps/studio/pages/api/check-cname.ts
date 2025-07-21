import { CheckCNAMERecordResponse } from 'data/custom-domains/check-cname-mutation'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { domain } = req.query

  try {
    const result: CheckCNAMERecordResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`,
      {
        method: 'GET',
        headers: { Accept: 'application/dns-json' },
      }
    ).then((res) => res.json())
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export default handler
