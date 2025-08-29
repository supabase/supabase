import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  return res.status(200).json({
    status: 'not_configured',
    canaryStatus: 'not_configured',
    poolerStatus: 'not_configured',
    warnings: [],
    errors: [],
    details: {
      port: 0,
      host: '',
      user: '',
      database: '',
      dns_query: '',
      connections: {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
      },
      latency: {
        current: 0,
        min: 0,
        max: 0,
      },
    },
    timestamp: new Date().toISOString(),
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet)
})

export default apiHandler
