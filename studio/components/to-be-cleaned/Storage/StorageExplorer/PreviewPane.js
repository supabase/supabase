import {
  Button,
  IconX,
  IconLoader,
  IconClipboard,
  IconDownload,
  IconTrash2,
  IconAlertCircle,
} from '@supabase/ui'
import SVG from 'react-inlinesvg'
import { formatBytes } from 'lib/helpers'
import { Transition } from '@headlessui/react'

const PreviewFile = ({ mimeType, previewUrl }) => {
  if (!mimeType || !previewUrl) {
    return (
      <SVG
        src={'/img/file-filled.svg'}
        alt={'No preview'}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
        }
      />
    )
  }
  if (previewUrl === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center text-scale-900">
        <IconLoader size={14} strokeWidth={2} className="animate-spin" />
      </div>
    )
  }
  if (previewUrl === 'skipped') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <SVG
          src={'/img/file-filled.svg'}
          alt={'No preview'}
          preProcessor={(code) =>
            code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
          }
        />
        <p className="text-sm text-center mt-2 w-2/5">
          File size is too large to preview in the explorer
        </p>
      </div>
    )
  }
  if (mimeType.includes('image')) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-center bg-contain bg-no-repeat"
        style={{ backgroundImage: `url('${previewUrl}')` }}
      />
    )
  }
  if (mimeType.includes('audio')) {
    return (
      <div className="w-full h-full flex items-center justify-center px-10">
        <audio key={previewUrl} controls style={{ width: 'inherit' }}>
          <source src={previewUrl} type="audio/mpeg" />
          <p className="text-scale-1100 text-sm">
            Your browser does not support the audio element.
          </p>
        </audio>
      </div>
    )
  }
  if (mimeType.includes('video')) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <video key={previewUrl} controls style={{ maxHeight: '100%' }}>
          <source src={previewUrl} type="video/mp4" />
          <p className="text-scale-1100 text-sm">Your browser does not support the video tag.</p>
        </video>
      </div>
    )
  }
  return (
    <SVG
      src={'/img/file-filled.svg'}
      alt={'No preview'}
      preProcessor={(code) =>
        code.replace(/svg/, 'svg class="mx-auto w-32 h-32 text-color-inherit opacity-75"')
      }
    />
  )
}

const PreviewPane = ({
  isOpen = false,
  file = {},
  width = 400,
  onCopyFileURL = () => {},
  onDownloadFile = () => {},
  onSelectFileDelete = () => {},
  onClosePreviewPane = () => {},
}) => {
  const size = file.metadata ? formatBytes(file.metadata.size) : null
  const mimeType = file.metadata ? file.metadata.mimetype : null
  const createdAt = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown'
  const updatedAt = file.updated_at ? new Date(file.updated_at).toLocaleString() : 'Unknown'

  return (
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
        bg-panel-header-light dark:bg-panel-header-dark
        h-full p-4 border-l border-panel-border-light dark:border-panel-border-dark"
        style={{ width }}
      >
        {/* Preview Header */}
        <div className="w-full flex justify-end text-scale-900 hover:text-scale-1200 transition-colors">
          <IconX
            className="cursor-pointer"
            size={14}
            strokeWidth={2}
            onClick={onClosePreviewPane}
          />
        </div>

        {/* Preview Thumbnail*/}
        <div className="border border-panel-border-light dark:border-panel-border-dark my-4">
          <div className="w-full h-56 2xl:h-72 flex items-center">
            <PreviewFile mimeType={mimeType} previewUrl={file.previewUrl} />
          </div>
        </div>

        <div className="w-full space-y-6">
          {/* Preview Information */}
          <div className="space-y-1">
            <h5 className="text-scale-1200 break-words text-base">{file.name}</h5>
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
              <label className="text-xs text-scale-900 mb-1">Added on</label>
              <p className="text-sm text-scale-1100">{createdAt}</p>
            </div>
            <div>
              <label className="text-xs text-scale-900 mb-1">Last modified</label>
              <p className="text-sm text-scale-1100">{updatedAt}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 border-b pb-4 border-panel-border-light dark:border-panel-border-dark">
            <Button
              type="default"
              icon={<IconDownload size={16} strokeWidth={2} />}
              onClick={() => onDownloadFile(file)}
              disabled={file.isCorrupted}
            >
              Download
            </Button>
            <Button
              type="outline"
              icon={<IconClipboard size={16} strokeWidth={2} />}
              onClick={() => onCopyFileURL(file)}
              disabled={file.isCorrupted}
            >
              Copy URL
            </Button>
          </div>
          <Button
            type="outline"
            shadow={false}
            size="tiny"
            icon={<IconTrash2 size={16} strokeWidth={2} />}
            onClick={() => onSelectFileDelete(file)}
          >
            Delete file
          </Button>
        </div>
      </div>
    </Transition>
  )
}

export default PreviewPane
