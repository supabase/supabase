import { NextApiRequest, NextApiResponse } from 'next'
import type {
  EdgeFunctionDeployment,
  RollbackResponse,
  RollbackResponseWithNewVersion,
} from 'components/interfaces/Functions/EdgeFunctionVersions/types'

// Import the same mock data store
let mockDeployments: EdgeFunctionDeployment[] = [
  {
    id: '54cc57df-4b2d-4983-91ea-0ba08c1d44e0',
    slug: 'super-function',
    version: 3,
    name: 'super-function',
    status: 'ACTIVE',
    entrypoint_path:
      'file:///tmp/user_fn_qxxlcbvvszqlusrmczke_54cc57df-4b2d-4983-91ea-0ba08c1d44e0_3/source/index.ts',
    import_map_path: null,
    import_map: false,
    verify_jwt: true,
    created_at: 1756400000000,
    updated_at: 1756400000000,
    commit_message: 'Add user authentication middleware',
    commit_hash: 'a1b2c3d',
    size_kb: 1.2,
  },
  {
    id: '3a1c2b3d-4e5f-6789-ab01-234567890b21',
    slug: 'super-function',
    version: 2,
    name: 'super-function',
    status: 'INACTIVE',
    entrypoint_path:
      'file:///tmp/user_fn_qxxlcbvvszqlusrmczke_3a1c2b3d-4e5f-6789-ab01-234567890b21_2/source/index.ts',
    import_map_path: null,
    import_map: false,
    verify_jwt: true,
    created_at: 1756230000000,
    updated_at: 1756230000000,
    commit_message: 'Fix CORS headers for production',
    commit_hash: 'b2c3d4e',
    size_kb: 0.9,
  },
  {
    id: 'c9f2a8e7-6543-210f-edcb-a9876543219de',
    slug: 'super-function',
    version: 1,
    name: 'super-function',
    status: 'INACTIVE',
    entrypoint_path:
      'file:///tmp/user_fn_qxxlcbvvszqlusrmczke_c9f2a8e7-6543-210f-edcb-a9876543219de_1/source/index.ts',
    import_map_path: null,
    import_map: false,
    verify_jwt: true,
    created_at: 1756153042342,
    updated_at: 1756153042342,
    commit_message: 'Initial Edge Function setup',
    commit_hash: 'c3d4e5f',
    size_kb: 0.3,
  },
]

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  const { slug, target_version } = req.query

  if (method === 'POST') {
    const targetVersion = req.body?.target_version || parseInt(target_version as string)

    if (!targetVersion || typeof targetVersion !== 'number') {
      return res.status(400).json({ message: 'target_version is required and must be a number' })
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Find current active version
    const currentActive = mockDeployments.find((d) => d.status === 'ACTIVE')
    const currentVersion = currentActive?.version || 3

    // Simulate random choice between behavior A and B
    const useBehaviorA = Math.random() > 0.5

    if (useBehaviorA) {
      // Behavior A: Re-activate older version
      mockDeployments = mockDeployments.map((d) => ({
        ...d,
        status: d.version === targetVersion ? 'ACTIVE' : 'INACTIVE',
      }))

      const response: RollbackResponse = {
        slug: slug as string,
        active_version: targetVersion,
        rolled_back_from: currentVersion,
        rolled_back_to: targetVersion,
      }

      return res.status(200).json(response)
    } else {
      // Behavior B: Create new deployment that copies older code
      const newVersion = Math.max(...mockDeployments.map((d) => d.version)) + 1
      const newDeployment: EdgeFunctionDeployment = {
        id: `new-deployment-${Date.now()}`,
        slug: slug as string,
        version: newVersion,
        name: slug as string,
        status: 'ACTIVE',
        entrypoint_path: `file:///tmp/user_fn_${Date.now()}/source/index.ts`,
        import_map_path: null,
        import_map: false,
        verify_jwt: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      }

      // Update mock data
      mockDeployments = [
        newDeployment,
        ...mockDeployments.map((d) => ({ ...d, status: 'INACTIVE' as const })),
      ]

      const response: RollbackResponseWithNewVersion = {
        id: newDeployment.id,
        slug: slug as string,
        version: newVersion,
        status: 'ACTIVE',
        rolled_back_from: currentVersion,
        rolled_back_to: targetVersion,
        created_at: newDeployment.created_at,
      }

      return res.status(200).json(response)
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
