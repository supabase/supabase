'use client'

import { File as FileIcon, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { createClient } from '@/lib/supabase/client'

type ItemFile = {
  id: number
  file_path: string
  sort_order: number
}

export type ItemPreviewFile = {
  id?: string | number
  name: string
  href?: string
  description?: string
}

type ItemFilesUploaderProps = {
  partnerId: number
  itemId?: number
  initialFiles?: ItemFile[]
  autoUploadSignal?: number
  showUploadAction?: boolean
  disabled?: boolean
  onRemovedFileIdsChange?: (fileIds: number[]) => void
  onAutoUploadComplete?: (result: { success: boolean }) => void
  onPreviewFilesChange?: (files: ItemPreviewFile[]) => void
}

function getFileName(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] ?? path
}

function isImagePath(path: string) {
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(path)
}

export function ItemFilesUploader({
  partnerId,
  itemId,
  initialFiles = [],
  autoUploadSignal = 0,
  showUploadAction = true,
  disabled = false,
  onRemovedFileIdsChange,
  onAutoUploadComplete,
  onPreviewFilesChange,
}: ItemFilesUploaderProps) {
  const [itemFiles, setItemFiles] = useState<ItemFile[]>(initialFiles)
  const [savingMetadata, setSavingMetadata] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [persistedSuccesses, setPersistedSuccesses] = useState<string[]>([])
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Record<number, string>>({})
  const supabase = useMemo(() => createClient(), [])

  const storagePath = useMemo(() => {
    if (!itemId) return undefined
    return `${partnerId}/items/${itemId}`
  }, [itemId, partnerId])

  const upload = useSupabaseUpload({
    bucketName: 'item_files',
    path: storagePath,
    maxFiles: 10,
    maxFileSize: 25_000_000,
  })

  const handleUpload = async () => {
    if (!itemId || !storagePath) {
      setMetadataError('Create the item first, then upload files.')
      return [{ name: 'metadata', message: 'Create the item first, then upload files.' }]
    }
    if (upload.files.length === 0) {
      return []
    }
    setMetadataError(null)
    const responses = await upload.onUpload()
    const responseSuccesses = responses.filter((x) => x.message === undefined).map((x) => x.name)
    const pending = responseSuccesses.filter((fileName) => !persistedSuccesses.includes(fileName))

    if (pending.length === 0) {
      return responses
    }

    setSavingMetadata(true)

    const currentMaxSort = itemFiles.reduce((max, file) => Math.max(max, file.sort_order), -1)
    const payload = pending.map((fileName, index) => ({
      item_id: itemId,
      file_path: `${storagePath}/${fileName}`,
      sort_order: currentMaxSort + index + 1,
    }))

    const { data, error } = await supabase
      .from('item_files')
      .insert(payload)
      .select('id, file_path, sort_order')

    if (error) {
      setMetadataError(error.message)
      setSavingMetadata(false)
      return [...responses, { name: 'metadata', message: error.message }]
    }

    const inserted = (data ?? []) as ItemFile[]
    setItemFiles((prev) => [...prev, ...inserted])
    setPersistedSuccesses((prev) => Array.from(new Set([...prev, ...pending])))
    setSavingMetadata(false)

    return responses
  }

  const handleRemovePersistedFile = (fileId: number) => {
    setItemFiles((prev) => prev.filter((file) => file.id !== fileId))
    setRemovedFileIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]))
  }

  useEffect(() => {
    onRemovedFileIdsChange?.(removedFileIds)
  }, [onRemovedFileIdsChange, removedFileIds])

  useEffect(() => {
    if (!onPreviewFilesChange) return

    const persistedPreviews = itemFiles
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((file) => {
        const name = getFileName(file.file_path)
        return {
          id: file.id,
          name,
          href: isImagePath(file.file_path) ? imagePreviewUrls[file.id] : undefined,
          description: file.file_path,
        } satisfies ItemPreviewFile
      })

    const persistedNames = new Set(persistedPreviews.map((file) => file.name))
    const pendingPreviews = upload.files
      .filter((file) => !persistedNames.has(file.name))
      .map((file, index) => ({
        id: `pending-${file.name}-${index}`,
        name: file.name,
        href: file.type.startsWith('image/') ? file.preview : undefined,
        description: 'Pending upload',
      }))

    onPreviewFilesChange([...persistedPreviews, ...pendingPreviews])
  }, [imagePreviewUrls, itemFiles, onPreviewFilesChange, upload.files])

  useEffect(() => {
    const imageFiles = itemFiles.filter((file) => isImagePath(file.file_path))
    if (imageFiles.length === 0) {
      setImagePreviewUrls({})
      return
    }

    let isCancelled = false
    const loadPreviews = async () => {
      const { data, error } = await supabase.storage.from('item_files').createSignedUrls(
        imageFiles.map((file) => file.file_path),
        60 * 60
      )
      if (isCancelled || error) return

      const nextUrls: Record<number, string> = {}
      imageFiles.forEach((file, index) => {
        const signedUrl = data?.[index]?.signedUrl
        if (signedUrl) {
          nextUrls[file.id] = signedUrl
        }
      })
      setImagePreviewUrls(nextUrls)
    }

    void loadPreviews()
    return () => {
      isCancelled = true
    }
  }, [itemFiles, supabase])

  useEffect(() => {
    if (!itemId || autoUploadSignal === 0) return

    let isCancelled = false

    const run = async () => {
      const responses = await handleUpload()
      if (isCancelled) return
      onAutoUploadComplete?.({
        success: responses.every((response) => response.message === undefined),
      })
    }

    void run()

    return () => {
      isCancelled = true
    }
  }, [autoUploadSignal, itemId])

  return (
    <div>
      <Dropzone {...upload} onUpload={handleUpload}>
        <DropzoneEmptyState />
        <DropzoneContent className="mt-4" showUploadAction={showUploadAction} disabled={disabled} />
      </Dropzone>
      {savingMetadata ? (
        <p className="text-xs text-muted-foreground">Saving file metadata...</p>
      ) : null}
      {metadataError ? <p className="text-xs text-destructive">{metadataError}</p> : null}
      {itemFiles.length > 0 ? (
        <ul className="space-y-2 mt-2">
          {itemFiles
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm text-muted-foreground"
              >
                {isImagePath(file.file_path) && imagePreviewUrls[file.id] ? (
                  <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                    <img
                      src={imagePreviewUrls[file.id]}
                      alt={getFileName(file.file_path)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
                    <FileIcon size={18} />
                  </div>
                )}
                <span className="min-w-0 grow truncate" title={getFileName(file.file_path)}>
                  {getFileName(file.file_path)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${getFileName(file.file_path)}`}
                  disabled={disabled}
                  onClick={() => handleRemovePersistedFile(file.id)}
                  className="inline-flex size-8 items-center justify-center rounded text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  )
}
