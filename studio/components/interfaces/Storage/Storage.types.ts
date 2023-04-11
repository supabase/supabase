export interface StorageBucket {
  id: string
  name: string
  owner: string
  public: boolean
  file_size_limit: number
  allowed_mime_types: string[]
  created_at: string
  updated_at: string
}

export interface BucketUpdatePayload {
  public?: boolean
  file_size_limit?: number
  allowed_mime_types?: string[]
}
