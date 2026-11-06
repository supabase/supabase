import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '@/data/storage/keys'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'

export async function uploadFilesToBucket({
  files,
  projectRef,
  hostEndpoint,
  bucketName,
  bucketId,
  currentPath,
  queryClient,
}: {
  files: File[]
  projectRef: string
  hostEndpoint: string
  bucketName: string
  bucketId: string
  currentPath: string
  queryClient: QueryClient
}) {
  if (files.length === 0) return

  const client = await createProjectSupabaseClient(projectRef, hostEndpoint)
  let successCount = 0

  for (const file of files) {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
    const { error } = await client.storage.from(bucketName).upload(filePath, file, { upsert: true })
    if (error) {
      toast.error(`Failed to upload ${file.name}: ${error.message}`)
    } else {
      successCount++
    }
  }

  if (successCount > 0) {
    toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`)
    const queryKey = storageKeys.objects(projectRef, bucketId, '')
    await queryClient.refetchQueries({ queryKey, type: 'active' })
  }
}
