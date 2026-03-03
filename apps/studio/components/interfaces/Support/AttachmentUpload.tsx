// End of third-party imports

import { useGenerateAttachmentURLsMutation } from 'data/support/generate-attachment-urls-mutation'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { compact } from 'lodash'
import { File, FileCode, Plus, X } from 'lucide-react'
import { InlineLink } from 'components/ui/InlineLink'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react'
import { toast } from 'sonner'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { createSupportStorageClient } from './support-storage-client'

const MAX_ATTACHMENTS = 5

const uploadAttachments = async ({ userId, files }: { userId: string; files: File[] }) => {
  const supportSupabaseClient = createSupportStorageClient()

  const filesToUpload = Array.from(files)
  const uploadedFiles = await Promise.all(
    filesToUpload.map(async (file) => {
      const suffix = file.name.endsWith('.har') ? 'har' : file.type.split('/')[1]
      const prefix = `${userId}/${uuidv4()}.${suffix}`
      const options = { cacheControl: '3600' }

      const { data, error } = await supportSupabaseClient.storage
        .from('support-attachments')
        .upload(prefix, file, options)

      if (error) console.error('Failed to upload:', file.name, error)
      return data
    })
  )
  const keys = compact(uploadedFiles).map((file) => file.path)
  return keys
}

export function useAttachmentUpload() {
  const { profile } = useProfile()
  const uploadButtonRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])

  const { mutateAsync: generateAttachmentURLs } = useGenerateAttachmentURLsMutation()

  const isFull = uploadedFiles.length >= MAX_ATTACHMENTS

  const addFile = useCallback(() => {
    uploadButtonRef.current?.click()
  }, [])

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      event.persist()
      const items = event.target.files || (event as any).dataTransfer.items
      const itemsCopied = Array.prototype.map.call(items, (item: any) => item) as File[]
      const itemsToBeUploaded = itemsCopied.slice(0, MAX_ATTACHMENTS - uploadedFiles.length)

      setUploadedFiles(uploadedFiles.concat(itemsToBeUploaded))
      if (items.length + uploadedFiles.length > MAX_ATTACHMENTS) {
        toast(`Only up to ${MAX_ATTACHMENTS} attachments are allowed`)
      }
      event.target.value = ''
    },
    [uploadedFiles]
  )

  const removeFileUpload = useCallback(
    (idx: number) => {
      const updatedFiles = uploadedFiles.slice()
      updatedFiles.splice(idx, 1)
      setUploadedFiles(updatedFiles)

      const updatedDataUrls = uploadedDataUrls.slice()
      uploadedDataUrls.splice(idx, 1)
      setUploadedDataUrls(updatedDataUrls)
    },
    [uploadedFiles, uploadedDataUrls]
  )

  useEffect(() => {
    if (!uploadedFiles) return
    const objectUrls = uploadedFiles.map((file) => {
      if (file.name.endsWith('.har')) {
        return file.name
      } else {
        return URL.createObjectURL(file)
      }
    })
    setUploadedDataUrls(objectUrls)

    return () => {
      objectUrls.forEach((url: any) => void URL.revokeObjectURL(url))
    }
  }, [uploadedFiles])

  const createAttachments = useCallback(async () => {
    if (!profile?.id) {
      console.error('[Support Form > uploadAttachments] Unable to upload files, missing user ID')
      toast.error('Unable to upload attachments')
      return []
    }

    if (uploadedFiles.length === 0) return

    const filenames = await uploadAttachments({ userId: profile.gotrue_id, files: uploadedFiles })
    const urls = await generateAttachmentURLs({ bucket: 'support-attachments', filenames })
    return urls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, uploadedFiles])

  return useMemo(
    () => ({
      uploadButtonRef,
      isFull,
      addFile,
      handleFileUpload,
      removeFileUpload,
      createAttachments,
      uploadedDataUrls,
    }),
    [isFull, addFile, handleFileUpload, removeFileUpload, createAttachments, uploadedDataUrls]
  )
}

interface AttachmentUploadDisplayProps {
  uploadButtonRef: RefObject<HTMLInputElement>
  isFull: boolean
  uploadedDataUrls: string[]
  addFile: () => void
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  removeFileUpload: (idx: number) => void
}

export function AttachmentUploadDisplay({
  uploadButtonRef,
  isFull,
  uploadedDataUrls,
  addFile,
  handleFileUpload,
  removeFileUpload,
}: AttachmentUploadDisplayProps) {
  const { profile } = useProfile()

  if (!profile) {
    return (
      <div>
        <h3 className="text-sm text-foreground">Attachments</h3>
        <p className="text-sm text-foreground-lighter mt-2">
          Uploads are only supported when logged in. Please reply to the acknowledgement email you
          will receive with any screenshots you'd like to upload.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-1">
        <p className="text-sm text-foreground">Attachments</p>
        <p className="text-sm text-foreground-lighter">
          Optionally upload up to {MAX_ATTACHMENTS} relevant images or{' '}
          <InlineLink href="https://github.com/orgs/supabase/discussions/36540">
            HAR files
          </InlineLink>
        </p>
      </div>
      <input
        multiple
        type="file"
        ref={uploadButtonRef}
        className="hidden"
        accept="image/png, image/jpeg, .har"
        onChange={handleFileUpload}
      />
      <div className="flex items-center gap-x-2">
        {uploadedDataUrls.map((url, idx) => {
          if (url.endsWith('.har')) {
            return (
              <div
                key={url}
                className="border relative h-14 w-14 rounded flex items-center justify-center"
              >
                <Tooltip>
                  <TooltipTrigger className="cursor-default" onClick={(e) => e.preventDefault()}>
                    <div className="flex flex-col items-center justify-center gap-y-1">
                      <FileCode className="text-foreground-light" size={16} />
                      <p className="text-[10px] font-mono text-foreground-light tracking-wide leading-none">
                        HAR
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{url}</TooltipContent>
                </Tooltip>

                <button
                  type="button"
                  aria-label="Remove attachment"
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full bg-red-900',
                    'absolute -top-1 -right-1 cursor-pointer'
                  )}
                  onClick={() => removeFileUpload(idx)}
                >
                  <X aria-hidden="true" size={10} strokeWidth={3} className="text-contrast" />
                </button>
              </div>
            )
          } else {
            return (
              <div
                key={url}
                style={{ backgroundImage: `url("${url}")` }}
                className="relative h-14 w-14 rounded bg-cover bg-center bg-no-repeat"
              >
                <button
                  type="button"
                  aria-label="Remove attachment"
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full bg-red-900',
                    'absolute -top-1 -right-1 cursor-pointer'
                  )}
                  onClick={() => removeFileUpload(idx)}
                >
                  <X aria-hidden="true" size={10} strokeWidth={3} className="text-contrast" />
                </button>
              </div>
            )
          }
        })}
        {!isFull && (
          <button
            type="button"
            className={cn(
              'border border-stronger opacity-50 transition hover:opacity-100',
              'group flex h-14 w-14 cursor-pointer items-center justify-center rounded'
            )}
            onClick={addFile}
          >
            <Plus strokeWidth={2} size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
