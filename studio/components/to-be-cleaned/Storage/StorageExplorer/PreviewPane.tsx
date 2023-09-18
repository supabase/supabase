import { isEmpty } from 'lodash'
import {
  Button,
  Dropdown,
  IconX,
  IconLoader,
  IconClipboard,
  IconDownload,
  IconTrash2,
  IconAlertCircle,
  IconChevronDown,
} from 'ui'
import SVG from 'react-inlinesvg'
import { formatBytes } from 'lib/helpers'
import { BASE_PATH } from 'lib/constants'
import { Transition } from '@headlessui/react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions } from 'hooks'
import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

const PreviewFile = ({ mimeType, previewUrl }: { mimeType: string; previewUrl: string }) => {
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
  if (previewUrl === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center text-scale-900">
        <IconLoader size={14} strokeWidth={2} className="animate-spin" />
      </div>
    )
  }
  if (previewUrl === 'skipped') {
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
          <p className="text-sm text-scale-1100">
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
          <p className="text-sm text-scale-1100">Your browser does not support the video tag.</p>
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

export interface PreviewPaneProps {
  onCopyUrl: (name: string, url: string) => void
}

const PreviewPane = ({ onCopyUrl }: PreviewPaneProps) => {
  const storageExplorerStore = useStorageStore()
  const {
    getFileUrl,
    downloadFile,
    selectedBucket,
    selectedFilePreview: file,
    closeFilePreview,
    setSelectedItemsToDelete,
    setSelectedFileCustomExpiry,
  } = storageExplorerStore

  const width = 450
  const isOpen = !isEmpty(file)
  const size = file.metadata ? formatBytes(file.metadata.size) : null
  const mimeType = file.metadata ? file.metadata.mimetype : null
  const createdAt = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown'
  const updatedAt = file.updated_at ? new Date(file.updated_at).toLocaleString() : 'Unknown'
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  return (
    <>
      <Transition
        show={isOpen}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0"
        enterTo="transform opacity-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100"
        leaveTo="transform opacity-0"
      >
        <div
          className="
        h-full border-l
        border-panel-border-light bg-panel-header-light p-4 dark:border-panel-border-dark dark:bg-panel-header-dark"
          style={{ width }}
        >
          {/* Preview Header */}
          <div className="flex w-full justify-end text-scale-900 transition-colors hover:text-scale-1200">
            <IconX
              className="cursor-pointer"
              size={14}
              strokeWidth={2}
              onClick={() => closeFilePreview()}
            />
          </div>

          {/* Preview Thumbnail*/}
          <div className="my-4 border border-panel-border-light dark:border-panel-border-dark">
            <div className="flex h-56 w-full items-center 2xl:h-72">
              <PreviewFile mimeType={mimeType} previewUrl={file.previewUrl} />
            </div>
          </div>

          <div className="w-full space-y-6">
            {/* Preview Information */}
            <div className="space-y-1">
              <h5 className="break-words text-base text-scale-1200">{file.name}</h5>
              {file.isCorrupted && (
                <div className="flex items-center space-x-2">
                  <IconAlertCircle size={14} strokeWidth={2} className="text-scale-1100" />
                  <p className="text-sm text-scale-1100">
                    File is corrupted, please delete and reupload this file again
                  </p>
                </div>
              )}
              {mimeType && (
                <p className="text-sm text-scale-1100">
                  {mimeType}
                  {size && <span> - {size}</span>}
                </p>
              )}
            </div>

            {/* Preview Metadata */}
            <div className="space-y-2">
              <div>
                <label className="mb-1 text-xs text-scale-900">Added on</label>
                <p className="text-sm text-scale-1100">{createdAt}</p>
              </div>
              <div>
                <label className="mb-1 text-xs text-scale-900">Last modified</label>
                <p className="text-sm text-scale-1100">{updatedAt}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 border-b border-panel-border-light pb-4 dark:border-panel-border-dark">
              <Button
                type="default"
                icon={<IconDownload size={16} strokeWidth={2} />}
                disabled={file.isCorrupted}
                onClick={async () => await downloadFile(file)}
              >
                Download
              </Button>
              {selectedBucket.public ? (
                <Button
                  type="outline"
                  icon={<IconClipboard size={16} strokeWidth={2} />}
                  onClick={async () => onCopyUrl(file.name, await getFileUrl(file))}
                  disabled={file.isCorrupted}
                >
                  Get URL
                </Button>
              ) : (
                <Dropdown
                  side="bottom"
                  align="center"
                  overlay={[
                    <Dropdown.Item
                      key="expires-one-week"
                      className="text-xs"
                      onClick={async () =>
                        onCopyUrl(file.name, await getFileUrl(file, URL_EXPIRY_DURATION.WEEK))
                      }
                    >
                      Expire in 1 week
                    </Dropdown.Item>,
                    <Dropdown.Item
                      key="expires-one-month"
                      className="text-xs"
                      onClick={async () =>
                        onCopyUrl(file.name, await getFileUrl(file, URL_EXPIRY_DURATION.MONTH))
                      }
                    >
                      Expire in 1 month
                    </Dropdown.Item>,
                    <Dropdown.Item
                      key="expires-one-year"
                      className="text-xs"
                      onClick={async () =>
                        onCopyUrl(file.name, await getFileUrl(file, URL_EXPIRY_DURATION.YEAR))
                      }
                    >
                      Expire in 1 year
                    </Dropdown.Item>,
                    <Dropdown.Item
                      key="custom-expiry"
                      className="text-xs"
                      onClick={() => setSelectedFileCustomExpiry(file)}
                    >
                      Custom expiry
                    </Dropdown.Item>,
                  ]}
                >
                  <Button
                    type="outline"
                    icon={<IconClipboard size={16} strokeWidth={2} />}
                    iconRight={<IconChevronDown />}
                    disabled={file.isCorrupted}
                  >
                    Get URL
                  </Button>
                </Dropdown>
              )}
            </div>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button
                  type="outline"
                  disabled={!canUpdateFiles}
                  size="tiny"
                  icon={<IconTrash2 size={16} strokeWidth={2} />}
                  onClick={() => setSelectedItemsToDelete([file])}
                >
                  Delete file
                </Button>
              </Tooltip.Trigger>
              {!canUpdateFiles && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
                        You need additional permissions to delete this file
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>
      </Transition>
    </>
  )
}

export default PreviewPane
