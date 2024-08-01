import { useParams } from 'common'
import { uuidv4 } from 'lib/helpers'
import {
  ChangeEventHandler,
  Dispatch,
  DragEventHandler,
  SetStateAction,
  useRef,
  useState,
} from 'react'
import { cn, Textarea } from 'ui'
import { uploadFileToSupabaseComProject } from './upload'
import { TextArea } from '@ui/components/shadcn/ui/text-area'

const VALID_FILE_EXTENSIONS = ['image/jpeg', 'image/png']

interface DroppableTextAreaProps {
  value: string
  onChange: Dispatch<SetStateAction<string>>
  className?: string
  disabled?: boolean
}

const getFile = async (fileEntry: FileSystemFileEntry) => {
  try {
    return await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject))
  } catch (err) {
    console.error('getFile error:', err)
    return undefined
  }
}

// https://stackoverflow.com/a/53058574
const getFilesDataTransferItems = async (items: DataTransferItemList) => {
  const files = []
  const queue: FileSystemEntry[] = []
  for (const item of items) {
    const entry = item.webkitGetAsEntry()
    if (entry) {
      queue.push(entry)
    }
  }
  while (queue.length > 0) {
    const entry = queue.shift()
    if (entry && entry.isFile) {
      const file = await getFile(entry as FileSystemFileEntry)
      if (file !== undefined) {
        // file.path = entry.fullPath.slice(1)
        files.push(file)
      }
    }
  }
  return files
}

export const DroppableTextArea = ({
  value,
  onChange,
  disabled,
  className,
}: DroppableTextAreaProps) => {
  const { slug } = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [areFilesValid, setAreFilesValid] = useState<'none' | 'valid' | 'invalid'>('none')

  const onDragOver: DragEventHandler<HTMLTextAreaElement> = (event) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  const uploadFiles = async (items: DataTransferItemList) => {
    const files = await getFilesDataTransferItems(items)

    files.forEach((file) => {
      const generatedId = uuidv4()
      onChange((v) => {
        return v + `\n![Uploading ${file.name}…]()\n`
      })

      uploadFileToSupabaseComProject(
        'temp-for-testing-integrations',
        `${slug}/${generatedId}`,
        file
      ).then((url) => {
        onChange((v) => {
          return v.replace(`![Uploading ${file.name}…]()`, `![${file.name}](${url})`)
        })
      })
    })
  }

  const onDrop: DragEventHandler<HTMLTextAreaElement> = async (event) => {
    onDragOver(event)

    if (areFilesValid === 'valid') {
      const items = (event as any).target.files || (event as any).dataTransfer.items
      uploadFiles(items)
    }
  }

  const checkFiles: DragEventHandler<HTMLTextAreaElement> = (event) => {
    const items = event.dataTransfer.items || []
    if (items.length === 0) {
      setAreFilesValid('none')
    }
    for (const item of items) {
      if (!VALID_FILE_EXTENSIONS.includes(item.type)) {
        setAreFilesValid('invalid')
        return
      }
    }
    setAreFilesValid('valid')
  }

  const onUploadClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const onInputChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const items = fileInputRef.current?.files || []
    if (items.length > 0) {
      // Create a new DataTransfer object
      const list = new DataTransfer()

      // Add each file to the DataTransfer object
      for (const file of items) {
        list.items.add(file)
      }
      uploadFiles(list.items)
    }
  }

  return (
    <div>
      <TextArea
        disabled={disabled}
        onDragEnter={(e) => checkFiles(e)}
        onDragExit={() => setAreFilesValid('none')}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          areFilesValid === 'valid'
            ? 'border-green-700'
            : areFilesValid === 'invalid'
              ? 'border-red-700'
              : '',
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        accept={VALID_FILE_EXTENSIONS.join(', ')}
        onChange={onInputChange}
      />

      <div className="px-1 pt-2">
        <span className="text-sm text-foreground-lighter">
          Extended description for your integration that will be shown on your page. Supports
          markdown formatting. Attach files by dragging &amp; dropping them or{' '}
          <a className="underline cursor-pointer" onClick={onUploadClick}>
            click here
          </a>{' '}
          to upload.
        </span>
      </div>
    </div>
  )
}
