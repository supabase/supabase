import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  return res.status(200).json({
    fileSizeLimit: 0,
    features: {
      imageTransformation: {
        enabled: false,
        defaultQuality: 0,
        allowedQualityRange: { min: 0, max: 0 },
        allowedWidthRange: { min: 0, max: 0 },
        allowedHeightRange: { min: 0, max: 0 },
      },
    },
    project_id: '',
    project_ref: ref ?? '',
    updated_at: new Date().toISOString(),
    region: '',
  })
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')
  const { fileSizeLimit, features } = req.body

  return res.status(200).json({
    fileSizeLimit: fileSizeLimit ?? 0,
    features: features ?? {
      imageTransformation: {
        enabled: false,
        defaultQuality: 0,
        allowedQualityRange: { min: 0, max: 0 },
        allowedWidthRange: { min: 0, max: 0 },
        allowedHeightRange: { min: 0, max: 0 },
      },
    },
    project_id: '',
    project_ref: ref ?? '',
    updated_at: new Date().toISOString(),
    region: '',
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).patch(handlePatch)
})

export default apiHandler
