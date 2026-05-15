export type DeploymentStatus = 'ACTIVE' | 'INACTIVE'

export type EdgeFunctionDeployment = {
  id: string
  slug: string
  name: string
  version: number
  status: DeploymentStatus
  entrypoint_path: string | null
  import_map_path: string | null
  import_map: boolean
  verify_jwt: boolean
  created_at: number // epoch ms
  updated_at: number // epoch ms
  // Optional metadata for display (not required by backend)
  commit_message?: string
  commit_hash?: string
  size_kb?: number
}

export type RollbackResponse = {
  slug: string
  active_version: number
  rolled_back_from: number
  rolled_back_to: number
}

export type RollbackResponseWithNewVersion = {
  id: string
  slug: string
  version: number
  status: DeploymentStatus
  rolled_back_from: number
  rolled_back_to: number
  created_at: number
}

export type CodeResponse = {
  version: number
  files: Array<{
    path: string
    content: string
  }>
}

export type DiffResponse = {
  from: number
  to: number
  diff: string
}
