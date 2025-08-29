import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  return res.status(200).json({
    ignore_startup_parameters: '',
    pool_mode: 'transaction',
    max_client_conn: 1000,
    default_pool_size: 20,
    min_pool_size: 0,
    client_idle_timeout: 0,
    application_name_add_host: false,
    database: '',
    host: '',
    port: 0,
    project_id: 0,
    project_ref: ref ?? '',
    status: 'not_configured',
    updated_at: '',
    user: '',
  })
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  return res.status(200).json({
    ignore_startup_parameters: '',
    pool_mode: req.body.pool_mode ?? 'transaction',
    max_client_conn: req.body.max_client_conn ?? 1000,
    default_pool_size: req.body.default_pool_size ?? 20,
    min_pool_size: req.body.min_pool_size ?? 0,
    client_idle_timeout: req.body.client_idle_timeout ?? 0,
    application_name_add_host: req.body.application_name_add_host ?? false,
    database: '',
    host: '',
    port: 0,
    project_id: 0,
    project_ref: ref ?? '',
    status: 'not_configured',
    updated_at: new Date().toISOString(),
    user: '',
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).put(handlePut)
})

export default apiHandler
