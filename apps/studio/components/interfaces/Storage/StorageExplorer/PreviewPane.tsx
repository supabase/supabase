import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import {
  AlertCircle,
  Archive,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  LoaderCircle,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItem } from '../Storage.types'
import { hasVersioningHistory } from '../StorageProtection.constants'
import { getPathAlongOpenedFolders } from './StorageExplorer.utils'
import { useCopyUrl } from './useCopyUrl'
import { useFetchFileUrlQuery } from './useFetchFileUrlQuery'
import { shortVersion, VersionHistory, VersionThumbnail } from './VersionHistory'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useObjectVersionRestoreMutation,
  useObjectVersionsQuery,
} from '@/data/storage/protection/object-versions-query'
import type { ObjectVersion } from '@/data/storage/protection/protection-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const PREVIEW_SIZE_LIMIT = 10 * 1024 * 1024 // 10MB

export const PreviewFile = ({ item }: { item: StorageItem }) => {
  const { projectRef, selectedBucket, openedFolders } = useStorageExplorerStateSnapshot()
  const folderPath = getPathAlongOpenedFolders({ openedFolders, selectedBucket }, false)
  const path = [folderPath, item.name].filter(Boolean).join('/')

  const { data: previewUrl, isPending: isLoading } = useFetchFileUrlQuery({
    path,
    projectRef: projectRef,
    bucket: selectedBucket,
  })

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

  const isVersionedBucket = hasVersioningHistory(selectedBucket?.id)
  const isPublicBucket = !!selectedBucket?.public
  const { data: versionsData } = useObjectVersionsQuery({
    projectRef,
    bucketId: selectedBucket?.id,
    objectName: file?.name,
  })
  const versionCount = versionsData?.length
  const currentVersion = versionsData?.find((v) => v.isCurrent)

  const [previewedVersion, setPreviewedVersion] = useState<ObjectVersion>()
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false)

  const { mutate: restoreVersion, isPending: isRestoring } = useObjectVersionRestoreMutation({
    onSuccess: () => {
      toast.success('Version restored as the current version')
      setPreviewedVersion(undefined)
    },
  })

  if (!file) return null

  const width = 450
  const size = file.metadata ? formatBytes(file.metadata.size) : null
  const mimeType = file.metadata ? file.metadata.mimetype : undefined
  const createdAt = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown'
  const updatedAt = file.updated_at ? new Date(file.updated_at).toLocaleString() : 'Unknown'

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

  const previewSlot =
    isComparing && previewedVersion ? (
      <VersionCompareWidget
        mimeType={mimeType}
        selectedVersion={previewedVersion}
        currentVersion={currentVersion}
        isRestoring={isRestoring}
        onRestore={handleRestore}
        onDismiss={() => setPreviewedVersion(undefined)}
      />
    ) : (
      <div className="border-b border-overlay p-3">
        <div
          // Viewport-height aware, since ~144px of chrome sits above (header +
          // this padding), so the preview height is derived from what's left
          // of the viewport rather than raw vh: 40% of the remaining space,
          // floored at 120px and capped at 180px. The floor guarantees the
          // sections below always have room to scroll; the cap keeps the
          // preview from dominating on tall viewports.
          className="flex items-center justify-center overflow-hidden rounded-md border border-overlay"
          style={{ height: 'clamp(120px, calc((100vh - 144px) * 0.4), 180px)' }}
        >
          <PreviewFile item={file} />
        </div>
        <div className="mt-2 flex flex-col">
          <div className="flex gap-1.5">
            <span className="truncate font-mono text-xs text-foreground-lighter overflow-visible">
              <div className="shrink-1">
                <p className="truncate text-sm font-medium text-foreground" title={file.name}>
                  {file.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-foreground-light flex items-center gap-x-1.5 flex-wrap overflow-visible">
                  {mimeType}
                  {size && <>, {size}</>}
                  {isVersionedBucket && currentVersion && (
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
            </span>
          </div>
          <div className="flex items-center gap-x-1 shrink-0 mt-3">
            <ButtonTooltip
              variant="outline"
              className="px-2"
              icon={<Download size={14} />}
              onClick={() => downloadFile(file)}
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
                  <DropdownMenuItem
                    onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.MONTH)}
                  >
                    Expire in 1 month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.YEAR)}>
                    Expire in 1 year
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFileCustomExpiry(file)}>
                    Custom expiry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canUpdateFiles && isVersionedBucket && (
              <div className="flex">
                <Button
                  variant="outline"
                  size="tiny"
                  className="rounded-r-none"
                  icon={<Archive size={14} />}
                  onClick={() => setSelectedItemsToDelete([file])}
                >
                  Archive
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="tiny"
                      className="shrink-0 rounded-l-none border-l-transparent px-1.5 -ml-px"
                      icon={<ChevronDown size={14} />}
                      aria-label="More delete options"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="flex flex-col w-full items-start gap-1.5"
                      onClick={() => setShowPermanentDeleteConfirm(true)}
                    >
                      <div className="flex items-center space-x-1 text-foreground">
                        <Trash2
                          size={14}
                          className="shrink-0 text-destructive focus:text-destructive"
                        />
                        <p>Delete permanently</p>
                      </div>
                      <p className="block text-foreground-light">
                        Also deletes all versions of this file. This cannot be undone.
                      </p>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {canUpdateFiles && !isVersionedBucket && (
              <Button
                variant="outline"
                size="tiny"
                icon={<Trash2 size={14} />}
                onClick={() => setSelectedItemsToDelete([file])}
              >
                Delete File
              </Button>
            )}
          </div>
        </div>
      </div>
    )

  const detailsSectionBody = (
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

  return (
    <div
      key={file.id ?? file.name}
      className="flex h-full flex-col border-l border-overlay bg-surface-100 min-w-[390px] max-w-[600px]"
      style={{ width }}
    >
      <div className="flex items-center gap-x-2 border-b border-overlay px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground" title={file.name}>
            File Preview
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-x-1">
          <Button
            variant="text"
            className="h-7 w-7 p-0"
            onClick={() => setSelectedFilePreview(undefined)}
            aria-label="Close preview"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {previewSlot}

        <div className="px-4 space-y-3 pt-3">
          {detailsSectionBody}
          {isVersionedBucket && (
            <PreviewSection title="Versions" count={versionCount} defaultOpen>
              <VersionHistory
                projectRef={projectRef}
                bucketId={selectedBucket?.id}
                objectName={file.name}
                mimeType={mimeType}
                previewedVersionId={previewedVersion?.versionId}
                onPreview={setPreviewedVersion}
                clearPreview={() => setPreviewedVersion(undefined)}
              />
            </PreviewSection>
          )}
        </div>
      </div>

      <ConfirmationModal
        variant="destructive"
        visible={showPermanentDeleteConfirm}
        title={<span className="wrap-break-word">Permanently delete {file.name}</span>}
        confirmLabel="Delete permanently"
        onCancel={() => setShowPermanentDeleteConfirm(false)}
        onConfirm={() => {
          toast.success(`Permanently deleted ${file.name}`)
          setShowPermanentDeleteConfirm(false)
        }}
        alert={{
          base: { variant: 'destructive' },
          title: 'This action cannot be undone',
          description:
            'This permanently deletes the file and all of its noncurrent versions — none of them can be restored afterwards.',
        }}
      />
    </div>
  )
}

// ── Compare + restore widget ─────────────────────────────────────────────

interface VersionCompareWidgetProps {
  mimeType?: string
  selectedVersion: ObjectVersion
  currentVersion?: ObjectVersion
  versionCount?: number
  isRestoring: boolean
  onRestore: () => void
  onDismiss: () => void
}

/**
 * Replaces the top preview slot the moment a noncurrent version is selected
 * — a side-by-side comparison and the restore confirmation in one, so there's
 * no modal and no silent preview swap. Dismissing (the × in its own corner)
 * returns the slot to the plain current-file preview.
 */
const VersionCompareWidget = ({
  mimeType,
  selectedVersion,
  currentVersion,
  isRestoring,
  onRestore,
  onDismiss,
}: VersionCompareWidgetProps) => {
  const label = shortVersion(selectedVersion.versionId)

  return (
    <div className="space-y-3 border-b border-overlay bg-brand-200/30 p-3">
      <div className="flex items-center gap-x-1.5">
        <RotateCcw size={13} className="shrink-0 text-brand" />
        <p className="truncate text-sm font-medium text-foreground">
          Restore v.{selectedVersion.versionId}?
        </p>
        <button
          type="button"
          className="ml-auto shrink-0 text-foreground-lighter transition-colors hover:text-foreground"
          onClick={onDismiss}
          aria-label="Cancel comparison"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center gap-x-2">
        <div className="flex-1 space-y-1.5">
          <div className="flex h-24 items-center justify-center rounded-md border border-brand-400 bg-surface-200">
            <VersionThumbnail mimeType={mimeType} isCurrent={false} size={20} />
          </div>
          <p className="truncate text-center font-mono text-[11px] text-brand">
            {dayjs(selectedVersion.createdAt).format('MMM D')} · {formatBytes(selectedVersion.size)}
          </p>
        </div>
        <ArrowRight size={14} className="shrink-0 text-foreground-lighter" />
        <div className="flex-1 space-y-1.5">
          <div className="flex h-24 items-center justify-center rounded-md border border-overlay bg-surface-200">
            <VersionThumbnail mimeType={mimeType} isCurrent size={20} />
          </div>
          <p className="truncate text-center font-mono text-[11px] text-foreground-lighter">
            Current{currentVersion && <> · {formatBytes(currentVersion.size)}</>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-x-1.5">
        <Button
          variant="primary"
          className="flex-1"
          icon={<RotateCcw size={14} />}
          loading={isRestoring}
          onClick={onRestore}
        >
          Restore version as current
        </Button>
        <ButtonTooltip
          variant="default"
          className="px-2"
          icon={<Download size={14} />}
          onClick={() => toast.success(`Downloading ${label}`)}
          tooltip={{ content: { side: 'top', text: 'Download version' } }}
        />
        <ButtonTooltip
          variant="default"
          className="px-2"
          icon={<Copy size={14} />}
          onClick={() => toast.success(`Copied URL for ${label}`)}
          tooltip={{ content: { side: 'top', text: 'Get version URL' } }}
        />
      </div>

      <p className="text-xs leading-relaxed text-foreground-lighter">
        {currentVersion && <strong>{currentVersion.versionId} </strong>}becomes a noncurrent version
        — nothing is deleted.
      </p>
    </div>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────

interface PreviewSectionProps {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * Vertically-stacked collapsible section used by the preview panel. Each
 * section renders a header row with a chevron and (optionally) a count, and
 * expands to reveal its body. Header borders separate sections cleanly when
 * multiple are stacked.
 */
const PreviewSection = ({ title, count, defaultOpen = false, children }: PreviewSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-foreground transition-colors hover:text-foreground-light"
        >
          <span className="flex items-center gap-x-2">
            {title}
            {count !== undefined && (
              <span className="text-xs font-normal text-foreground-lighter">{count}</span>
            )}
          </span>
          <ChevronRight
            size={14}
            className={cn('text-foreground-lighter transition-transform', isOpen && 'rotate-90')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
