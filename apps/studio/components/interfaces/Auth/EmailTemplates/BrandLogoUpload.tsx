import { useParams } from 'common'
import { Database, ExternalLink, ImageIcon, ImageOff, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Input_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { handleError, post } from '@/data/fetchers'
import { useBucketQuery } from '@/data/storage/buckets-query'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'

const BUCKET_NAME = 'email-assets'
const LOGO_PATH_PREFIX = 'brand-logo'

interface BrandLogoUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export const BrandLogoUpload = ({ value, onChange, disabled }: BrandLogoUploadProps) => {
  const { ref: projectRef } = useParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showBucketConfirm, setShowBucketConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const { storageEndpoint, hostEndpoint } = useProjectApiUrl({ projectRef })
  const clientEndpoint = storageEndpoint ?? hostEndpoint ?? ''

  const { data: existingBucket } = useBucketQuery(
    { projectRef, bucketId: BUCKET_NAME },
    { retry: false }
  )
  const bucketExists = !!existingBucket
  const bucketIsPrivate = bucketExists && !existingBucket?.public

  const isStorageUrl = useMemo(() => {
    if (!value) return false
    const endpoints = [storageEndpoint, hostEndpoint].filter((ep): ep is string => !!ep)
    return endpoints.some((ep) => value.startsWith(ep))
  }, [value, storageEndpoint, hostEndpoint])

  const handleUploadClick = () => {
    inputRef.current?.click()
  }

  const performUpload = async (file: File) => {
    if (!projectRef) return

    setIsUploading(true)
    try {
      // Always attempt bucket creation — a no-op if it already exists,
      // and avoids stale-closure issues with the bucketExists flag.
      const { error: bucketError } = await post('/platform/storage/{ref}/buckets', {
        params: { path: { ref: projectRef } },
        body: { id: BUCKET_NAME, public: true },
      })
      // Only surface errors that aren't "bucket already exists"
      if (bucketError && !JSON.stringify(bucketError).toLowerCase().includes('already exists')) {
        handleError(bucketError)
      }

      const client = await createProjectSupabaseClient(projectRef, clientEndpoint)

      // Best-effort delete of the previous logo so old URLs are invalidated
      if (isStorageUrl) {
        const marker = `/object/public/${BUCKET_NAME}/`
        const idx = value.indexOf(marker)
        if (idx !== -1) {
          const oldPath = value.slice(idx + marker.length)
          await client.storage.from(BUCKET_NAME).remove([oldPath])
        }
      }

      const ext = file.name.split('.').pop()
      const newPath = `${LOGO_PATH_PREFIX}-${crypto.randomUUID()}${ext ? `.${ext}` : ''}`

      const { error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(newPath, file, { cacheControl: '3600' })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = client.storage.from(BUCKET_NAME).getPublicUrl(newPath)

      onChange(publicUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to upload logo: ${message}`)
    } finally {
      setIsUploading(false)
      setPendingFile(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!bucketExists) {
      setPendingFile(file)
      setShowBucketConfirm(true)
    } else {
      performUpload(file)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-strong bg-surface-200">
        {isUploading ? (
          <Loader2 size={24} className="animate-spin text-foreground-muted" />
        ) : value && isStorageUrl ? (
          <img src={value} alt="Brand logo preview" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon size={24} className="text-foreground-muted" />
        )}
      </div>

      {value && (
        <div>
          {isStorageUrl ? (
            <Link
              href={`/project/${projectRef}/storage/buckets/${BUCKET_NAME}`}
              className="flex w-fit items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground"
            >
              <Database size={11} />
              Stored in Supabase Storage
              <ExternalLink size={11} />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <ImageOff size={11} />
              External URL · Preview unavailable
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input_Shadcn_
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/logo.png"
          disabled={disabled || isUploading}
          className="flex-1"
        />
        <Button
          type="default"
          icon={<Upload size={14} />}
          loading={isUploading}
          disabled={disabled || isUploading}
          onClick={handleUploadClick}
        >
          Upload
        </Button>
      </div>

      {value && isStorageUrl && bucketIsPrivate && (
        <Admonition
          type="warning"
          title="Bucket is not public"
          description={
            <span>
              Your{' '}
              <Link
                href={`/project/${projectRef}/storage/buckets/${BUCKET_NAME}`}
                className="underline"
              >
                {BUCKET_NAME}
              </Link>{' '}
              bucket is private. The logo will not be visible in emails. Set it to public or review
              your{' '}
              <Link href={`/project/${projectRef}/storage/policies`} className="underline">
                RLS policies
              </Link>{' '}
              to allow anonymous reads.
            </span>
          }
        />
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
      />

      <ConfirmationModal
        visible={showBucketConfirm}
        size="medium"
        title="Create storage bucket"
        description={
          <span>
            A public storage bucket named <code className="text-xs">email-assets</code> will be
            created in your project to host your brand logo. Files in this bucket are publicly
            accessible via URL.
          </span>
        }
        confirmLabel="Create bucket"
        onCancel={() => {
          setShowBucketConfirm(false)
          setPendingFile(null)
          if (inputRef.current) inputRef.current.value = ''
        }}
        onConfirm={() => {
          setShowBucketConfirm(false)
          if (pendingFile) performUpload(pendingFile)
        }}
      />
    </div>
  )
}
