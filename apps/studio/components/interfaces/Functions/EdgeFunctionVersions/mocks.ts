import type {
  EdgeFunctionDeployment,
  RollbackResponse,
  RollbackResponseWithNewVersion,
  CodeResponse,
  DiffResponse,
} from './types'

// Mock data store - this would be replaced with real API calls
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

// Mock code content for each version
export const mockCodeContent = {
  3: `import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  // Authentication middleware
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const { data: user, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return new Response('Invalid token', { status: 401 })
  }
  
  return new Response(JSON.stringify({ user: user.user }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
  2: `import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}`,
  1: `export default async function handler(req) {
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
}

// Fake API endpoints - simulating async API calls with setTimeout
// These would be replaced with real API calls when backend is ready

/**
 * Fetch all deployments for a function
 */
export async function fetchDeployments(
  projectId: string,
  slug: string
): Promise<EdgeFunctionDeployment[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return mockDeployments
}

/**
 * Roll back to a specific version
 */
export async function rollbackToVersion(
  projectId: string,
  slug: string,
  targetVersion: number
): Promise<RollbackResponse | RollbackResponseWithNewVersion> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Find current active version
  const currentActive = mockDeployments.find((d) => d.status === 'ACTIVE')
  const currentVersion = currentActive?.version || 3

  // Simulate random choice between behavior A and B
  const useBehaviorA = Math.random() > 0.5

  if (useBehaviorA) {
    // Behavior A: Re-activate older version
    // Update mock data
    mockDeployments = mockDeployments.map((d) => ({
      ...d,
      status: d.version === targetVersion ? 'ACTIVE' : 'INACTIVE',
    }))

    return {
      slug: 'super-function',
      active_version: targetVersion,
      rolled_back_from: currentVersion,
      rolled_back_to: targetVersion,
    }
  } else {
    // Behavior B: Create new deployment that copies older code
    const newVersion = Math.max(...mockDeployments.map((d) => d.version)) + 1
    const newDeployment: EdgeFunctionDeployment = {
      id: `new-deployment-${Date.now()}`,
      slug: 'super-function',
      version: newVersion,
      name: 'super-function',
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

    return {
      id: newDeployment.id,
      slug: 'super-function',
      version: newVersion,
      status: 'ACTIVE',
      rolled_back_from: currentVersion,
      rolled_back_to: targetVersion,
      created_at: newDeployment.created_at,
    }
  }
}

/**
 * Fetch code for a specific version (v1 feature)
 */
export async function fetchVersionCode(
  projectId: string,
  slug: string,
  version: number
): Promise<CodeResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const content = mockCodeContent[version as keyof typeof mockCodeContent] || ''

  return {
    version,
    files: [
      { path: 'index.ts', content },
      { path: 'import_map.json', content: '{}' },
    ],
  }
}

/**
 * Get diff between two versions (v1 feature)
 */
export async function fetchVersionDiff(
  projectId: string,
  slug: string,
  fromVersion: number,
  toVersion: number
): Promise<DiffResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  return {
    from: fromVersion,
    to: toVersion,
    diff: `--- a/index.ts
+++ b/index.ts
@@ -1,5 +1,10 @@
+import { createClient } from '@supabase/supabase-js'
+
 export default async function handler(req) {
+  const supabase = createClient(
+    Deno.env.get('SUPABASE_URL'),
+    Deno.env.get('SUPABASE_ANON_KEY')
+  )
   return new Response(JSON.stringify({ message: 'Hello World' }), {
     headers: { 'Content-Type': 'application/json' }
   })`,
  }
}
