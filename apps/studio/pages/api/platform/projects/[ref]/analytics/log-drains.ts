import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from 'lib/constants/api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { ref } = req.query

  const missingEnvVars = envVarsSet()

  if (missingEnvVars !== true) {
    return res
      .status(500)
      .json({ error: { message: `${missingEnvVars.join(', ')} env variables are not set` } })
  }

  const baseUrl = PROJECT_ANALYTICS_URL
  if (!baseUrl) {
    return res.status(500).json({ error: { message: `LOGFLARE_URL env variable is not set` } })
  }

  switch (method) {
    case 'GET':
      // list log drains
      const url = new URL(baseUrl)
      url.pathname = '/api/backends'
      url.search = new URLSearchParams({
        'metadata[type]': 'log-drain',
      }).toString()
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then((res) => {
        return res.json()
      })

      return res.status(200).json(resp)
    case 'POST':
      // create the log drain
      const postUrl = new URL(baseUrl)
      postUrl.pathname = '/api/backends'
      const postResult = await fetch(postUrl, {
        body: JSON.stringify({
          ...req.body,
          config: req.body.config,
          metadata: {
            type: 'log-drain',
          },
        }),
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then(async (r) => await r.json())

      const sourcesGetUrl = new URL(baseUrl)
      sourcesGetUrl.pathname = '/api/sources'
      const sources = await fetch(sourcesGetUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then((r) => r.json())

      const params = sources
        .filter((source: { name: string; metadata: { type: string } }) =>
          [
            'cloudflare.logs.prod',
            'deno-relay-logs',
            'deno-subhosting-events',
            'gotrue.logs.prod',
            'pgbouncer.logs.prod',
            'postgrest.logs.prod',
            'postgres.logs',
            'realtime.logs.prod',
            'storage.logs.prod.2',
          ].includes(source.name.toLocaleLowerCase())
        )
        .map((source: { name: string; id: number }) => {
          return { backend_id: postResult.id, lql_string: `~".*?"`, source_id: source.id }
        })
      const rulesPostUrl = new URL(baseUrl)
      rulesPostUrl.pathname = '/api/rules'
      await Promise.all(
        params.map((param: any) =>
          fetch(rulesPostUrl, {
            method: 'POST',
            body: JSON.stringify(param),
            headers: {
              Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          })
        )
      )
      return res.status(201).json(postResult)

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const envVarsSet = () => {
  const missingEnvVars = [
    process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN ? null : 'LOGFLARE_PRIVATE_ACCESS_TOKEN',
    process.env.LOGFLARE_URL ? null : 'LOGFLARE_URL',
  ].filter((v) => v)
  if (missingEnvVars.length == 0) {
    return true
  } else {
    return missingEnvVars
  }
}
