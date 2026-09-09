import { NextApiRequest, NextApiResponse } from 'next'

import { CheckCNAMERecordResponse } from '@/data/custom-domains/check-cname-mutation'

const DOMAIN_RE = /^[a-zA-Z0-9._-]{1,253}$/

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const raw = req.query.domain
  const domain = Array.isArray(raw) ? raw[0] : raw

  if (!domain || !DOMAIN_RE.test(domain)) {
    return res.status(400).json({ message: 'Invalid domain' })
  }

  try {
    const result: CheckCNAMERecordResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
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
