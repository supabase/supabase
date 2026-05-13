import { NextApiRequest, NextApiResponse } from 'next'

import { CheckCNAMERecordResponse } from '@/data/custom-domains/check-cname-mutation'

// Only allow valid public hostnames — prevents URL injection and SSRF
const VALID_HOSTNAME_RE =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const rawDomain = req.query.domain
  const domain = Array.isArray(rawDomain) ? rawDomain[0] : rawDomain

  if (!domain || !VALID_HOSTNAME_RE.test(domain)) {
    return res.status(400).json({ message: 'Invalid domain name' })
  }

  try {
    const url = new URL('https://cloudflare-dns.com/dns-query')
    url.searchParams.set('name', domain)
    url.searchParams.set('type', 'CNAME')

    const result: CheckCNAMERecordResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/dns-json' },
    }).then((res) => res.json())
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export default handler
