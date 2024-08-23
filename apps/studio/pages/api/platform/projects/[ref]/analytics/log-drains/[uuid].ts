import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from 'pages/api/constants'
import { get } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { uuid } = req.query

  const missingEnvVars = envVarsSet()

  if (missingEnvVars !== true) {
    return res
      .status(500)
      .json({ error: { message: `${missingEnvVars.join(', ')} env variables are not set` } })
  }

  switch (method) {
    case 'GET':
      // get log drain
      const url = new URL(PROJECT_ANALYTICS_URL)
      url.pathname = `/api/backends/${uuid}`
      const result = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then(r=>r.json())


      return res.status(200).json(result)
    case 'PUT':
      // create the log drain
      const putUrl = new URL(PROJECT_ANALYTICS_URL)
      putUrl.pathname = `/api/backends/${uuid}`
      delete req.body["metadata"]
      const putResult = await fetch(putUrl, {
        body: JSON.stringify(req.body),
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then(async r =>  await r.json())
      return res.status(200).json(putResult)

    case 'DELETE':
      // create the log drain
      const deleteUrl = new URL(PROJECT_ANALYTICS_URL)
      deleteUrl.pathname = `/api/backends/${uuid}`
      console.log('deleteUrl', deleteUrl)
      await fetch(deleteUrl, {
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        method: 'DELETE',
      }).then(async r =>  await r.json())
      return res.status(204).json({error: null})
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const envVarsSet = () => {
  const missingEnvVars = [
    process.env.LOGFLARE_PUBLIC_ACCESS_TOKEN ? null : 'LOGFLARE_PUBLIC_ACCESS_TOKEN',
    process.env.LOGFLARE_URL ? null : 'LOGFLARE_URL',
  ].filter((v) => v)
  if (missingEnvVars.length == 0) {
    return true
  } else {
    return missingEnvVars
  }
}
