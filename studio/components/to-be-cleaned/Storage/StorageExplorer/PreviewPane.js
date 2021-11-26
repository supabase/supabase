import {
  Button,
  Space,
  IconX,
  IconLoader,
  IconClipboard,
  IconDownload,
  IconTrash2,
  Typography,
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
      <div className="w-full h-full flex items-center justify-center">
        <Typography.Text>
          <IconLoader size={16} strokeWidth={2} className="animate-spin" />
        </Typography.Text>
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
          <Typography.Text>File size is too large to preview in the explorer</Typography.Text>
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
          <Typography.Text>Your browser does not support the audio element.</Typography.Text>
        </audio>
      </div>
    )
  }
  if (mimeType.includes('video')) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <video key={previewUrl} controls style={{ maxHeight: '100%' }}>
          <source src={previewUrl} type="video/mp4" />
          <Typography.Text>Your browser does not support the video tag.</Typography.Text>
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
        <div className="w-full flex justify-end">
          <Typography.Text type="secondary">
            <IconX
              className="cursor-pointer"
              size={16}
              strokeWidth={2}
              onClick={onClosePreviewPane}
            />
          </Typography.Text>
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
            <div className="flex items-center">
              <Typography.Text>
                <p className="font-bold mr-2">{file.name}</p>
              </Typography.Text>
            </div>
            {mimeType && (
              <Typography.Text type="secondary">
                <p className="text-sm">
                  {mimeType}
                  {size && <span> - {size}</span>}
                </p>
              </Typography.Text>
            )}
          </div>

          {/* Preview Metadata */}
          <div className="space-y-2">
            <div>
              <Typography.Text>
                <Typography.Text type="secondary">
                  <p className="text-sm mb-1">Added on</p>
                </Typography.Text>
                <p className="text-sm">{createdAt}</p>
              </Typography.Text>
            </div>
            <div>
              <Typography.Text>
                <Typography.Text type="secondary">
                  <p className="text-sm mb-1">Last modified</p>
                </Typography.Text>
                <p className="text-sm">{updatedAt}</p>
              </Typography.Text>
            </div>
          </div>

          {/* Actions */}
          <div className="space-x-2 border-b pb-4 border-panel-border-light dark:border-panel-border-dark">
            <Space>
              <Button
                type="default"
                icon={<IconDownload size={16} strokeWidth={2} />}
                onClick={() => onDownloadFile(file)}
              >
                Download
              </Button>
              <Button
                type="default"
                icon={<IconClipboard size={16} strokeWidth={2} />}
                onClick={() => onCopyFileURL(file)}
              >
                Copy URL
              </Button>
            </Space>
          </div>
          <Button
            type="text"
            shadow={false}
            size="tiny"
            danger
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
