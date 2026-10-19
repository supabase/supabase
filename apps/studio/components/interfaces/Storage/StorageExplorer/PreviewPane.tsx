import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircleIcon,
  ArchiveIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { fromLifecycleRules } from '../FilesBuckets/BucketVersioningFields/BucketVersioningFields.lifecycle'
import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItem } from '../Storage.types'
import {
  getBucketVersioningState,
  hasVersioningHistory,
  isVersioningActive,
  willRetainVersionOnWrite,
} from '../StorageVersioning.constants'
import { FilePreview } from './FilePreview'
import { pickFile } from './pickFile'
import { PreviewSection } from './PreviewSection'
import { getPathAlongOpenedFolders } from './StorageExplorer.utils'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { useCopyUrl } from './useCopyUrl'
import { VersionCompareWidget } from './VersionCompareWidget'
import { VersionHistory } from './VersionHistory'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { bucketLifecycleQueryOptions } from '@/data/storage/bucket-lifecycle-query'
import { useObjectVersionRestoreMutation } from '@/data/storage/versioning/object-version-restore-mutation'
import {
  objectVersionsQueryOptions,
  type LifecyclePolicy,
  type ObjectVersion,
} from '@/data/storage/versioning/object-versions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const PANEL_WIDTH = 450

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
  path: string
  mimeType?: string
  size: string | null
  isPublicBucket: boolean
  hasVersions: boolean
  canArchive: boolean
  replacementAction?: ReactNode
  currentVersionId?: string
  hasCurrentVersion: boolean
  canUpdateFiles: boolean
  onCopyUrl: (path: string, expiry?: number) => void
  onDownload: () => void
  onCustomExpiry: () => void
  onDelete: () => void
  onPurge: () => void
}

const CurrentFilePreview = ({
  file,
  path,
  mimeType,
  size,
  isPublicBucket,
  hasVersions,
  canArchive,
  replacementAction,
  currentVersionId,
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
      className="flex items-center justify-center overflow-hidden rounded-md border border-overlay"
      style={{ height: 'clamp(120px, calc((100vh - 144px) * 0.4), 180px)' }}
    >
      <FilePreview
        path={path}
        mimeType={mimeType}
        size={file.metadata?.size}
        versionId={currentVersionId}
      />
    </div>

    <div className="mt-2 flex flex-col">
      <div className="shrink">
        {/* No `title`: the explorer rows use it as their handle, and a second
            element carrying the same one makes `getByTitle` ambiguous. */}
        <p className="truncate text-sm font-medium text-foreground">{getBaseFileName(file.name)}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 truncate text-xs text-foreground-light">
          {mimeType}
          {size && <>, {size}</>}
          {hasVersions && hasCurrentVersion && (
            <Badge variant="success" className="-my-1">
              Current
            </Badge>
          )}
        </div>
        {file.isCorrupted && (
          <div className="mt-1 flex items-center gap-x-1.5">
            <AlertCircleIcon size={12} className="shrink-0 text-foreground-light" />
            <p className="text-xs text-foreground-light">File is corrupted</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center gap-x-1">
        <ButtonTooltip
          variant="outline"
          className="px-2"
          icon={<DownloadIcon size={14} />}
          disabled={file.isCorrupted}
          onClick={onDownload}
          tooltip={{ content: { side: 'top', text: 'Download current' } }}
        />

        {replacementAction}

        {isPublicBucket ? (
          <Button
            variant="outline"
            size="tiny"
            icon={<CopyIcon size={14} />}
            disabled={file.isCorrupted}
            onClick={() => onCopyUrl(file.path!)}
          >
            Get URL
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="tiny"
                icon={<CopyIcon size={14} />}
                iconRight={<ChevronDownIcon size={14} />}
                disabled={file.isCorrupted}
                aria-label={`Get URL for ${file.name}`}
              >
                Get URL
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

        {/* A delete in a versioned bucket is a soft delete/archive, unless specified explicitly */}
        {canUpdateFiles && canArchive && (
          <div className="flex">
            <Button
              variant="outline"
              size="tiny"
              className="rounded-r-none"
              icon={<ArchiveIcon size={14} />}
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
                  icon={<ChevronDownIcon size={14} />}
                  aria-label="More delete options"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex w-full flex-col items-start gap-1.5"
                  onClick={onPurge}
                >
                  <div className="flex items-center space-x-1 text-foreground">
                    <Trash2Icon size={14} className="shrink-0 text-destructive" />
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

        {canUpdateFiles && !canArchive && (
          <ButtonTooltip
            variant="outline"
            size="tiny"
            icon={<Trash2Icon size={14} />}
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
    openedFolders,
    setSelectedItemsToDelete,
    setItemsToPurge,
    refetchAllOpenedFolders,
    replaceFile,
    setSelectedFileCustomExpiry,
    downloadFile,
  } = useStorageExplorerStateSnapshot()
  const { clearPreviewedFile } = useStorageExplorerNavigation()
  const { onCopyUrl } = useCopyUrl()

  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()

  const [, setShowEditBucketModal] = useQueryState(
    'edit',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [previewedVersion, setPreviewedVersion] = useState<ObjectVersion>()

  const versioningState = getBucketVersioningState(selectedBucket)

  // The version endpoints address an object by full path, not the leaf name in the row.
  const folderPath = getPathAlongOpenedFolders({ openedFolders, selectedBucket }, false)
  const filePath = file ? [folderPath, file.name].filter(Boolean).join('/') : undefined

  const { data: lifecycle } = useQuery({
    ...bucketLifecycleQueryOptions({ projectRef, bucketId: selectedBucket?.id }),
    enabled: isStorageVersioningEnabled && !!projectRef && !!selectedBucket?.id,
  })
  const storedPolicy = fromLifecycleRules(lifecycle)
  const lifecyclePolicy: LifecyclePolicy = {
    expiryDays: storedPolicy.versionExpiryDays,
    maxVersions: storedPolicy.maxNoncurrentVersions,
  }

  const { data: versions } = useQuery({
    ...objectVersionsQueryOptions({
      projectRef,
      bucketId: selectedBucket?.id,
      path: filePath,
      lifecyclePolicy,
    }),
    enabled: isStorageVersioningEnabled && !!projectRef && !!selectedBucket?.id && !!filePath,
  })

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: async () => {
      toast.success('Version restored as the current version')
      setPreviewedVersion(undefined)
      await refetchAllOpenedFolders()
    },
  })

  if (!file) return null

  const size = file.metadata ? formatBytes(file.metadata.size) : null
  const mimeType = file.metadata ? file.metadata.mimetype : undefined
  const createdAt = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown'
  const updatedAt = file.updated_at ? new Date(file.updated_at).toLocaleString() : 'Unknown'

  const currentVersion = versions?.find((version) => version.isCurrent)
  const hasVersions = isStorageVersioningEnabled && hasVersioningHistory(selectedBucket)
  const isActivelyVersioning = isStorageVersioningEnabled && isVersioningActive(selectedBucket)
  // The label names the action being taken, not the retention behind it: a suspended bucket
  // reads "Replace file" even for a file that still has one retained version coming.
  const replaceLabel = isActivelyVersioning ? 'Upload new version' : 'Replace file'
  // A suspended bucket only retains a copy when this particular file predates the suspension.
  const willRetainVersion =
    isStorageVersioningEnabled &&
    willRetainVersionOnWrite({ versioningState, isObjectVersioned: file.is_versioned })

  const hasRetainedVersions = (versions?.length ?? 0) > 0
  const showVersionHistory = hasVersions && (willRetainVersion || hasRetainedVersions)

  const isComparing = previewedVersion !== undefined && !previewedVersion.isCurrent

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id || !previewedVersion || !filePath) return
    restoreVersion({
      projectRef,
      bucketId: selectedBucket.id,
      path: filePath,
      versionId: previewedVersion.versionId,
    })
  }

  const onReplaceFile = async () => {
    const newFile = await pickFile()
    if (newFile !== undefined) await replaceFile({ file: newFile, item: file })
  }

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
          onClick={clearPreviewedFile}
          aria-label="Close preview"
        >
          <XIcon size={14} />
        </Button>
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        {isComparing ? (
          <VersionCompareWidget
            path={filePath ?? file.name}
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
            path={filePath ?? file.name}
            mimeType={mimeType}
            size={size}
            isPublicBucket={!!selectedBucket?.public}
            hasVersions={hasVersions}
            canArchive={isActivelyVersioning}
            replacementAction={
              canUpdateFiles && isStorageVersioningEnabled ? (
                <ButtonTooltip
                  variant="outline"
                  className="px-2"
                  icon={<UploadIcon size={14} />}
                  onClick={onReplaceFile}
                  aria-label={replaceLabel}
                  tooltip={{ content: { side: 'top', text: replaceLabel } }}
                />
              ) : undefined
            }
            currentVersionId={currentVersion?.versionId}
            hasCurrentVersion={currentVersion !== undefined}
            canUpdateFiles={canUpdateFiles}
            onCopyUrl={onCopyUrl}
            onDownload={() => downloadFile(file)}
            onCustomExpiry={() => setSelectedFileCustomExpiry(file)}
            onDelete={() => setSelectedItemsToDelete([file])}
            onPurge={() => setItemsToPurge([file])}
          />
        )}

        <div className="space-y-3 px-4 pt-3">
          <FileDetails createdAt={createdAt} updatedAt={updatedAt} />

          {showVersionHistory && (
            <PreviewSection title="Versions" count={versions?.length} defaultOpen>
              <VersionHistory
                projectRef={projectRef}
                bucketId={selectedBucket?.id}
                objectName={file.name}
                path={filePath ?? file.name}
                versioningState={versioningState}
                willRetainVersionOnWrite={willRetainVersion}
                lifecyclePolicy={lifecyclePolicy}
                expirationMode={storedPolicy.expirationMode}
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
    </div>
  )
}

const getBaseFileName = (name: string) => {
  return name.split('/').filter(Boolean).pop() ?? name
}
