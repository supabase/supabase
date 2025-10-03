import { NextApiRequest, NextApiResponse } from 'next'
import type { EdgeFunctionDeployment } from 'components/interfaces/Functions/EdgeFunctionVersions/types'

// Mock data store - same as in mocks.ts but in API endpoint
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
  const { slug } = req.query

  if (method === 'GET') {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Filter deployments by slug (in real implementation, this would be handled by database query)
    const deployments = mockDeployments.filter((d) => d.slug === slug)

    return res.status(200).json(deployments)
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
