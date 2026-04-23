import { useParams } from 'common'
import { ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { handleError, post } from '@/data/fetchers'
import { useBucketQuery } from '@/data/storage/buckets-query'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'

const BUCKET_NAME = 'email-assets'
const LOGO_PATH = 'brand-logo'

interface BrandLogoUploadProps {
  value: string
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
}

export const BrandLogoUpload = ({ value, onChange, onRemove, disabled }: BrandLogoUploadProps) => {
  const { ref: projectRef } = useParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showBucketConfirm, setShowBucketConfirm] = useState(false)

  const { storageEndpoint, hostEndpoint } = useProjectApiUrl({ projectRef })
  const clientEndpoint = storageEndpoint ?? hostEndpoint ?? ''

  const { data: existingBucket } = useBucketQuery(
    { projectRef, bucketId: BUCKET_NAME },
    { retry: false }
  )
  const bucketExists = !!existingBucket

  const handleUploadClick = () => {
    if (!bucketExists) {
      setShowBucketConfirm(true)
    } else {
      inputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !projectRef) return

    setIsUploading(true)
    try {
      if (!bucketExists) {
        const { error: bucketError } = await post('/platform/storage/{ref}/buckets', {
          params: { path: { ref: projectRef } },
          body: { id: BUCKET_NAME, public: true },
        })
        if (bucketError) handleError(bucketError)
      }

      const client = await createProjectSupabaseClient(projectRef, clientEndpoint)
      const { error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(LOGO_PATH, file, { upsert: true, cacheControl: '3600' })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = client.storage.from(BUCKET_NAME).getPublicUrl(LOGO_PATH)

      onChange(publicUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to upload logo: ${message}`)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={handleUploadClick}
        className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-strong bg-surface-200 transition-colors hover:border-foreground-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 size={20} className="animate-spin text-foreground-muted" />
        ) : value ? (
          <img src={value} alt="Brand logo" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon size={20} className="text-foreground-muted" />
        )}
      </button>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Button
            type="default"
            size="tiny"
            icon={<Upload size={12} />}
            loading={isUploading}
            disabled={disabled || isUploading}
            onClick={handleUploadClick}
          >
            {value ? 'Replace' : 'Upload logo'}
          </Button>
          {value && !isUploading && (
            <Button
              type="text"
              size="tiny"
              icon={<X size={12} />}
              disabled={disabled}
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>
        {value && (
          <p className="max-w-xs truncate text-xs text-foreground-lighter" title={value}>
            {value}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
      />

      <ConfirmationModal
        visible={showBucketConfirm}
        title="Create storage bucket"
        description={
          <span>
            A public storage bucket named <code className="text-xs">email-assets</code> will be
            created in your project to host your brand logo. Files in this bucket are publicly
            accessible via URL.
          </span>
        }
        confirmLabel="Create bucket and upload"
        onCancel={() => setShowBucketConfirm(false)}
        onConfirm={() => {
          setShowBucketConfirm(false)
          inputRef.current?.click()
        }}
      />
    </div>
  )
}
