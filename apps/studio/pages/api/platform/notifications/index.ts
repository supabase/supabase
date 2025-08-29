import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    data: {
      notifications: [
        {
          id: '',
          project_id: '',
          organization_id: '',
          inserted_at: '',
          notification_seen_at: null,
          notification_status: 'new',
          category: 'info',
          meta: {
            actions: [],
            error_message: '',
            org_slug: '',
            project_ref: '',
            priority: 'low',
          },
        },
      ],
      total_count: 1,
    },
  })
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // Expect array of { id: string, status: string }
  const updates = Array.isArray(req.body) ? req.body : []

  return res.status(200).json({
    data: updates.map((update) => ({
      id: update.id || '',
      notification_status: update.status || 'new',
      notification_seen_at: '',
      archived_at: null,
    })),
  })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    data: {
      deleted: true,
    },
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).patch(handlePatch).delete(handleDelete)
)

export default apiHandler
