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
    data: [
      {
        period_start: '',
        total_compute_hours: 0,
        total_compute_cost: 0,
        total_compute_cost_formatted: '',
        total_compute_spend: 0,
        total_compute_spend_formatted: '',
        projects: [],
      },
    ],
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
