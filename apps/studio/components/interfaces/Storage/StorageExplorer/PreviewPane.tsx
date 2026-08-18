import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Archive,
  ChevronDown,
  Copy,
  Download,
  LoaderCircle,
  Trash2,
  X,
} from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef, useState } from 'react'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItem } from '../Storage.types'
import { getBucketVersioningState } from '../StorageVersioning.constants'
import { PreviewSection } from './PreviewSection'
import { getPathAlongOpenedFolders } from './StorageExplorer.utils'
import { useCopyUrl } from './useCopyUrl'
import { useFetchFileUrlQuery } from './useFetchFileUrlQuery'
import { VersionCompareWidget } from './VersionCompareWidget'
import { VersionHistory } from './VersionHistory'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useObjectPurgeMutation } from '@/data/storage/versioning/object-purge-mutation'
import { useObjectVersionRestoreMutation } from '@/data/storage/versioning/object-version-restore-mutation'
import {
  objectVersionsQueryOptions,
  type LifecyclePolicy,
  type ObjectVersion,
} from '@/data/storage/versioning/object-versions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const PREVIEW_SIZE_LIMIT = 10 * 1024 * 1024 // 10MB

const PANEL_WIDTH = 450

/**
 * TODO(storage-versioning): read the bucket's stored policy once the Storage API
 * returns it. No condition is set until then, so no row shows an expiry.
 */
const EMPTY_LIFECYCLE_POLICY: LifecyclePolicy = { expiryDays: null, maxVersions: null }

const PreviewFile = ({ item }: { item: StorageItem }) => {
  const { projectRef, selectedBucket, openedFolders } = useStorageExplorerStateSnapshot()
  const folderPath = getPathAlongOpenedFolders({ openedFolders, selectedBucket }, false)
  const path = [folderPath, item.name].filter(Boolean).join('/')

  const { data: previewUrl, isPending: isLoading } = useFetchFileUrlQuery({
    path,
    projectRef: projectRef,
    bucket: selectedBucket,
  })

  // if the size is not available, we set it to be greater than the max size
  const size = +(item.metadata?.size ?? PREVIEW_SIZE_LIMIT + 1)
  const mimeType = item.metadata?.mimetype

  const isSkipped = !!mimeType && !!size && size > PREVIEW_SIZE_LIMIT

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-foreground-lighter">
        <LoaderCircle size={14} className="animate-spin text-foreground-lighter" />
      </div>
    )
  }
  if (isSkipped) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <SVG
          src={`${BASE_PATH}/img/file-filled.svg`}
          preProcessor={(code) =>
            code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
          }
        />
        <p className="mt-2 w-2/5 text-center text-sm">
          File size is too large to preview in the explorer
        </p>
      </div>
    )
  }
  if (!mimeType || !previewUrl) {
    return (
      <SVG
        src={`${BASE_PATH}/img/file-filled.svg`}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
        }
      />
    )
  }

  if (mimeType.includes('image')) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${previewUrl}')` }}
      />
    )
  }
  if (mimeType.includes('audio')) {
    return (
      <div className="flex h-full w-full items-center justify-center px-10">
        <audio key={previewUrl} controls style={{ width: 'inherit' }}>
          <source src={previewUrl} type="audio/mpeg" />
          <p className="text-sm text-foreground-light">
            Your browser does not support the audio element.
          </p>
        </audio>
      </div>
    )
  }
  if (mimeType.includes('video')) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <video key={previewUrl} controls style={{ maxHeight: '100%' }}>
          <source src={previewUrl} type="video/mp4" />
          <p className="text-sm text-foreground-light">
            Your browser does not support the video tag.
          </p>
        </video>
      </div>
    )
  }
  return (
    <SVG
      src={`${BASE_PATH}/img/file-filled.svg`}
      preProcessor={(code) =>
        code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
      }
    />
  )
}

interface FileDetailsProps {
  createdAt: string
  updatedAt: string
}

const FileDetails = ({ createdAt, updatedAt }: FileDetailsProps) => (
  <div className="space-y-2">
    <div>
      <label className="mb-1 text-xs text-foreground-lighter">Added on</label>
      <p className="text-sm text-foreground-light">{createdAt}</p>
    </div>
    <div>
      <label className="mb-1 text-xs text-foreground-lighter">Last modified</label>
      <p className="text-sm text-foreground-light">{updatedAt}</p>
    </div>
  </div>
)

interface CurrentFilePreviewProps {
  file: StorageItem
  mimeType?: string
  size: string | null
  isPublicBucket: boolean
  isVersionedBucket: boolean
  hasCurrentVersion: boolean
  canUpdateFiles: boolean
  onCopyUrl: (path: string, expiry?: number) => void
  onDownload: () => void
  onCustomExpiry: () => void
  onDelete: () => void
  onPurge: () => void
}

/** The default top slot: the current file's thumbnail, metadata and actions. */
const CurrentFilePreview = ({
  file,
  mimeType,
  size,
  isPublicBucket,
  isVersionedBucket,
  hasCurrentVersion,
  canUpdateFiles,
  onCopyUrl,
  onDownload,
  onCustomExpiry,
  onDelete,
  onPurge,
}: CurrentFilePreviewProps) => (
  <div className="border-b border-overlay p-3">
    <div
      /*
       * ~144px of chrome sits above, so the preview takes 40% of what's left of
       * the viewport. The floor keeps the sections below scrollable; the cap
       * stops the preview dominating tall viewports.
       */
      className="flex items-center justify-center overflow-hidden rounded-md border border-overlay"
      style={{ height: 'clamp(120px, calc((100vh - 144px) * 0.4), 180px)' }}
    >
      <PreviewFile item={file} />
    </div>

    <div className="mt-2 flex flex-col">
      <div className="shrink">
        <p className="truncate text-sm font-medium text-foreground" title={file.name}>
          {file.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 truncate text-xs text-foreground-light">
          {mimeType}
          {size && <>, {size}</>}
          {isVersionedBucket && hasCurrentVersion && (
            <Badge variant="success" className="-my-1">
              Current
            </Badge>
          )}
        </p>
        {file.isCorrupted && (
          <div className="mt-1 flex items-center gap-x-1.5">
            <AlertCircle size={12} className="shrink-0 text-foreground-light" />
            <p className="text-xs text-foreground-light">File is corrupted</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center gap-x-1">
        <ButtonTooltip
          variant="outline"
          className="px-2"
          icon={<Download size={14} />}
          disabled={file.isCorrupted}
          onClick={onDownload}
          tooltip={{ content: { side: 'top', text: 'Download current' } }}
        />

        {isPublicBucket ? (
          <Button
            variant="outline"
            size="tiny"
            icon={<Copy size={14} />}
            disabled={file.isCorrupted}
            onClick={() => onCopyUrl(file.path!)}
          >
            Copy URL
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="tiny"
                icon={<Copy size={14} />}
                iconRight={<ChevronDown size={14} />}
                disabled={file.isCorrupted}
                aria-label={`Copy URL for ${file.name}`}
              >
                Copy URL
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.WEEK)}>
                Expire in 1 week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.MONTH)}>
                Expire in 1 month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.YEAR)}>
                Expire in 1 year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCustomExpiry}>Custom expiry</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* A delete here is a soft delete, so the button says so and the real
            destructive action moves behind the split menu. */}
        {canUpdateFiles && isVersionedBucket && (
          <div className="flex">
            <Button
              variant="outline"
              size="tiny"
              className="rounded-r-none"
              icon={<Archive size={14} />}
              onClick={onDelete}
            >
              Archive
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="tiny"
                  className="-ml-px shrink-0 rounded-l-none border-l-transparent px-1.5"
                  icon={<ChevronDown size={14} />}
                  aria-label="More delete options"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex w-full flex-col items-start gap-1.5"
                  onClick={onPurge}
                >
                  <div className="flex items-center space-x-1 text-foreground">
                    <Trash2 size={14} className="shrink-0 text-destructive" />
                    <p>Delete permanently</p>
                  </div>
                  <p className="block text-foreground-light">
                    Also deletes every version of this file. This cannot be undone.
                  </p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {canUpdateFiles && !isVersionedBucket && (
          <ButtonTooltip
            variant="outline"
            size="tiny"
            icon={<Trash2 size={14} />}
            onClick={onDelete}
            tooltip={{ content: { side: 'top', text: 'Delete file' } }}
          >
            Delete file
          </ButtonTooltip>
        )}
      </div>
    </div>
  </div>
)

export const PreviewPane = () => {
  const {
    projectRef,
    selectedBucket,
    selectedFilePreview: file,
    setSelectedItemsToDelete,
    setSelectedFilePreview,
    setSelectedFileCustomExpiry,
    downloadFile,
  } = useStorageExplorerStateSnapshot()
  const { onCopyUrl } = useCopyUrl()

  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()

  // The bucket page owns `?edit=true` and mounts the modal on it, so routing
  // through the URL avoids threading a callback down the explorer tree.
  const [, setShowEditBucketModal] = useQueryState(
    'edit',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [previewedVersion, setPreviewedVersion] = useState<ObjectVersion>()
  const [isPurgeConfirmVisible, setIsPurgeConfirmVisible] = useState(false)

  const versioningState = getBucketVersioningState(selectedBucket)

  const { data: versions } = useQuery({
    ...objectVersionsQueryOptions({
      projectRef,
      bucketId: selectedBucket?.id,
      objectName: file?.name,
      lifecyclePolicy: EMPTY_LIFECYCLE_POLICY,
    }),
    enabled: isStorageVersioningEnabled && !!projectRef && !!selectedBucket?.id && !!file?.name,
  })

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: () => {
      toast.success('Version restored as the current version')
      setPreviewedVersion(undefined)
    },
  })

  const { mutate: purgeObject, isPending: isPurging } = useObjectPurgeMutation({
    onSuccess: () => {
      setIsPurgeConfirmVisible(false)
      setSelectedFilePreview(undefined)
    },
  })

  if (!file) return null

  const size = file.metadata ? formatBytes(file.metadata.size) : null
  const mimeType = file.metadata ? file.metadata.mimetype : undefined
  const createdAt = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown'
  const updatedAt = file.updated_at ? new Date(file.updated_at).toLocaleString() : 'Unknown'

  const currentVersion = versions?.find((version) => version.isCurrent)
  const isVersionedBucket = isStorageVersioningEnabled && versioningState !== 'disabled'
  const isComparing = previewedVersion !== undefined && !previewedVersion.isCurrent

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id || !previewedVersion) return
    restoreVersion({
      projectRef,
      bucketId: selectedBucket.id,
      objectName: file.name,
      versionId: previewedVersion.versionId,
    })
  }

  const handlePurge = () => {
    if (!projectRef || !selectedBucket?.id) return
    purgeObject({ projectRef, bucketId: selectedBucket.id, objectName: file.name })
  }

  // The compare widget replaces the top of the panel, so scroll up to show it.
  const handlePreviewVersion = (version: ObjectVersion) => {
    setPreviewedVersion(version)
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      key={file.id ?? file.name}
      className="flex h-full min-w-[390px] max-w-[600px] flex-col border-l border-overlay bg-surface-100"
      style={{ width: PANEL_WIDTH }}
    >
      <div className="flex items-center gap-x-2 border-b border-overlay px-4 py-2.5">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">File Preview</p>
        <Button
          variant="text"
          className="h-7 w-7 shrink-0 p-0"
          onClick={() => setSelectedFilePreview(undefined)}
          aria-label="Close preview"
        >
          <X size={14} />
        </Button>
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        {isComparing ? (
          <VersionCompareWidget
            mimeType={mimeType}
            selectedVersion={previewedVersion}
            currentVersion={currentVersion}
            isRestoring={isRestoring}
            onRestore={handleRestore}
            onDismiss={() => setPreviewedVersion(undefined)}
          />
        ) : (
          <CurrentFilePreview
            file={file}
            mimeType={mimeType}
            size={size}
            isPublicBucket={!!selectedBucket?.public}
            isVersionedBucket={isVersionedBucket}
            hasCurrentVersion={currentVersion !== undefined}
            canUpdateFiles={canUpdateFiles}
            onCopyUrl={onCopyUrl}
            onDownload={() => downloadFile(file)}
            onCustomExpiry={() => setSelectedFileCustomExpiry(file)}
            onDelete={() => setSelectedItemsToDelete([file])}
            onPurge={() => setIsPurgeConfirmVisible(true)}
          />
        )}

        <div className="space-y-3 px-4 pt-3">
          <FileDetails createdAt={createdAt} updatedAt={updatedAt} />

          {isStorageVersioningEnabled && (
            <PreviewSection title="Versions" count={versions?.length} defaultOpen>
              <VersionHistory
                projectRef={projectRef}
                bucketId={selectedBucket?.id}
                objectName={file.name}
                versioningState={versioningState}
                lifecyclePolicy={EMPTY_LIFECYCLE_POLICY}
                expirationMode="and"
                mimeType={mimeType}
                previewedVersionId={previewedVersion?.versionId}
                onPreview={handlePreviewVersion}
                clearPreview={() => setPreviewedVersion(undefined)}
                onEditBucket={() => setShowEditBucketModal(true)}
              />
            </PreviewSection>
          )}
        </div>
      </div>

      <ConfirmationModal
        variant="destructive"
        visible={isPurgeConfirmVisible}
        title={<span className="wrap-break-word">Permanently delete {file.name}?</span>}
        confirmLabel="Delete permanently"
        confirmLabelLoading="Deleting..."
        loading={isPurging}
        onCancel={() => setIsPurgeConfirmVisible(false)}
        onConfirm={handlePurge}
        alert={{
          base: { variant: 'destructive' },
          title: 'This cannot be undone',
          description:
            'This deletes the file and every noncurrent version of it. None of them can be restored afterwards.',
        }}
      />
    </div>
  )
}
