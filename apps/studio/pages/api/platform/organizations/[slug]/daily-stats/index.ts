import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({
      error: { message: 'Organization slug is required' },
    })
  }

  return res.status(200).json({
    data: {
      total_requests: 0,
      total_db_size_bytes: 0,
      total_db_egress_bytes: 0,
      total_storage_size_bytes: 0,
      total_storage_egress_bytes: 0,
      total_realtime_requests: 0,
      total_realtime_egress_bytes: 0,
      total_realtime_connection_seconds: 0,
      total_edge_function_invocations: 0,
      total_edge_function_count: 0,
      total_edge_function_egress_bytes: 0,
      total_edge_function_execution_seconds: 0,
      total_auth_billing_period_users: 0,
      total_successful_builds: 0,
    },
    dateRange: {
      start: '',
      end: '',
    },
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet)
})

export default apiHandler
