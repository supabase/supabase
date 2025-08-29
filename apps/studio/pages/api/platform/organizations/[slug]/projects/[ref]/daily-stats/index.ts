import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')
  const { attribute, startDate, endDate, interval = '1d' } = req.query

  if (!attribute || !startDate || !endDate) {
    return res.status(400).json({
      error: { message: 'Missing required query parameters' },
    })
  }

  const dataPoints = []
  const currentDate = new Date(startDate as string)
  const end = new Date(endDate as string)

  while (currentDate <= end) {
    dataPoints.push({
      timestamp: currentDate.toISOString(),
      period_start: currentDate.toISOString(),
      period_end: currentDate.toISOString(),
      [attribute as string]: 0,
      sum: 0,
      max: 0,
      min: 0,
      avg: 0,
      count: 0,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return res.status(200).json({
    data: dataPoints,
    query: {
      attribute: attribute as string,
      startDate: startDate as string,
      endDate: endDate as string,
      interval: interval as string,
      projectRef: ref,
    },
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet)
})

export default apiHandler
