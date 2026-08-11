import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Info,
  LoaderCircle,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import SVG from 'react-inlinesvg'
import { toast } from 'sonner'
import {
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

import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItem } from '../Storage.types'
import { hasVersioningHistory, isBucketVersioned } from '../StorageProtection.constants'
import { getPathAlongOpenedFolders } from './StorageExplorer.utils'
import { useCopyUrl } from './useCopyUrl'
import { useFetchFileUrlQuery } from './useFetchFileUrlQuery'
import { VersionHistory } from './VersionHistory'

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

  const isVersioningActive = isBucketVersioned(selectedBucket?.id)
  const showVersions = hasVersioningHistory(selectedBucket?.id)
  const { data: versionsData } = useObjectVersionsQuery({
    projectRef,
    bucketId: selectedBucket?.id,
    objectName: file?.name,
  })
  const versionCount = versionsData?.length

  const [previewedVersion, setPreviewedVersion] = useState<ObjectVersion>()

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

  const isPreviewingOlderVersion = previewedVersion !== undefined && !previewedVersion.isCurrent

  const handleRestore = () => {
    if (!projectRef || !selectedBucket?.id || !previewedVersion) return
    restoreVersion({
      projectRef,
      bucketId: selectedBucket.id,
      objectName: file.name,
      versionId: previewedVersion.versionId,
    })
  }

  const previewThumbnail = (
    // Viewport-height aware. ~144px of chrome sits above the preview (close
    // button + surrounding padding + filename summary), so the preview height
    // is derived from what's left of the viewport rather than raw vh: 40% of
    // the remaining space, floored at 120px and capped at 230px. The floor
    // guarantees the sections below always have room to scroll; the cap keeps
    // the preview from dominating on tall viewports; and subtracting the
    // chrome upfront makes the shrink kick in noticeably earlier than a plain
    // vh clamp would.
    <div
      className="relative shrink-0 border border-overlay"
      style={{ height: 'clamp(120px, calc((100vh - 144px) * 0.4), 230px)' }}
    >
      <div className="flex h-full w-full items-center">
        <PreviewFile item={file} />
      </div>
      {isPreviewingOlderVersion && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-x-2 border-t border-overlay bg-surface-100/95 px-3 py-1.5">
          <p className="text-xs text-foreground-light">
            Previewing version{' '}
            <span className="font-mono text-foreground">
              {previewedVersion.versionId.slice(0, 6)}…
            </span>
            <br />
            {dayjs(previewedVersion.createdAt).format('MMM D, HH:mm')}
          </p>
          <Button
            variant="default"
            size="tiny"
            icon={<RotateCcw size={14} />}
            loading={isRestoring}
            onClick={handleRestore}
          >
            Restore
          </Button>
        </div>
      )}
    </div>
  )

  const filenameSummary = (
    <div className="mt-4 space-y-1">
      <h5 className="wrap-break-word text-base text-foreground">{file.name}</h5>
      {file.isCorrupted && (
        <div className="flex items-center space-x-2">
          <AlertCircle size={14} className="text-foreground-light" />
          <p className="text-sm text-foreground-light">
            File is corrupted, please delete and reupload this file again
          </p>
        </div>
      )}
      {mimeType && (
        <p className="text-sm text-foreground-light">
          {mimeType}
          {size && <span> · {size}</span>}
          {showVersions && versionCount !== undefined && <span> · {versionCount} versions</span>}
        </p>
      )}
    </div>
  )

  const detailsSectionBody = (
    <div className="space-y-4 pt-3">
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

      <div className="flex space-x-2 border-b border-overlay pb-4">
        <Button
          variant="default"
          icon={<Download />}
          disabled={file.isCorrupted}
          onClick={() => downloadFile(file)}
        >
          Download
        </Button>
        {selectedBucket.public ? (
          <Button
            variant="outline"
            icon={<Copy />}
            onClick={() => onCopyUrl(file.path!)}
            disabled={file.isCorrupted}
          >
            Get URL
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                icon={<Copy />}
                iconRight={<ChevronDown />}
                disabled={file.isCorrupted}
              >
                Get URL
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="center">
              <DropdownMenuItem
                key="expires-one-week"
                onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.WEEK)}
              >
                Expire in 1 week
              </DropdownMenuItem>
              <DropdownMenuItem
                key="expires-one-month"
                onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.MONTH)}
              >
                Expire in 1 month
              </DropdownMenuItem>
              <DropdownMenuItem
                key="expires-one-year"
                onClick={() => onCopyUrl(file.path!, URL_EXPIRY_DURATION.YEAR)}
              >
                Expire in 1 year
              </DropdownMenuItem>
              <DropdownMenuItem
                key="custom-expiry"
                onClick={() => setSelectedFileCustomExpiry(file)}
              >
                Custom expiry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="space-y-2">
        <ButtonTooltip
          variant="outline"
          disabled={!canUpdateFiles}
          size="tiny"
          icon={<Trash2 />}
          onClick={() => setSelectedItemsToDelete([file])}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateFiles
                ? 'You need additional permissions to delete this file'
                : undefined,
            },
          }}
        >
          Delete file
        </ButtonTooltip>
        {isVersioningActive && (
          <p className="flex items-start gap-1.5 text-xs text-foreground-lighter">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              Deleting this file will soft-delete the object and all its versions. You can restore
              them from the deleted versions view.
            </span>
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div
      key={file.id ?? file.name}
      className="flex h-full flex-col border-l border-overlay bg-surface-100"
      style={{ width }}
    >
      <div className="flex w-full justify-end px-4 pt-4 text-foreground-lighter transition-colors hover:text-foreground">
        <X className="cursor-pointer" size={14} onClick={() => setSelectedFilePreview(undefined)} />
      </div>

      {/* Sticky (via flex-shrink control) preview + filename block. The
          scrollable sections below get whatever vertical space remains. */}
      <div className="flex shrink-0 flex-col px-4 pb-4">
        {previewThumbnail}
        {filenameSummary}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <PreviewSection title="Details" defaultOpen>
          {detailsSectionBody}
        </PreviewSection>
        {showVersions && (
          <PreviewSection title="Versions" count={versionCount} defaultOpen>
            <div className="pt-3">
              <VersionHistory
                projectRef={projectRef}
                bucketId={selectedBucket?.id}
                objectName={file.name}
                previewedVersionId={previewedVersion?.versionId}
                onPreview={setPreviewedVersion}
              />
            </div>
          </PreviewSection>
        )}
      </div>
    </div>
  )
}

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-overlay">
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
