import { useParams } from 'common'
import { uuidv4 } from 'lib/helpers'
import { uploadAttachment } from 'lib/upload'
import { Dispatch, DragEventHandler, SetStateAction, useState } from 'react'
import { cn, Textarea } from 'ui'

const VALID_FILE_EXTENSIONS = ['image/jpeg', 'image/png']

interface DroppableTextAreaProps {
  value: string
  onChange: Dispatch<SetStateAction<string>>
}

export const DroppableTextArea = ({ value, onChange }: DroppableTextAreaProps) => {
  const { slug } = useParams()
  const [areFilesValid, setAreFilesValid] = useState<'none' | 'valid' | 'invalid'>('none')

  const onDragOver = (event: any) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
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

  const onDrop: DragEventHandler<HTMLTextAreaElement> = async (event) => {
    onDragOver(event)

    if (areFilesValid === 'valid') {
      const items = (event as any).target.files || (event as any).dataTransfer.items
      const files = await getFilesDataTransferItems(items)

      files.forEach((file) => {
        const generatedId = uuidv4()
        onChange((v) => {
          return v + `\n![Uploading ${file.name}…]()\n`
        })

        uploadAttachment('temp-for-testing-integrations', `${slug}/${generatedId}`, file).then(
          (url) => {
            onChange((v) => {
              return v.replace(`![Uploading ${file.name}…]()`, `![${file.name}](${url})`)
            })
          }
        )
      })
      // onChange(description)
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

  return (
    <div>
      <Textarea
        onDragEnter={(e) => checkFiles(e)}
        onDragExit={() => setAreFilesValid('none')}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          areFilesValid === 'valid'
            ? 'border-green-700'
            : areFilesValid === 'invalid'
            ? 'border-red-700'
            : ''
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="px-1 pt-2">
        <span className="text-sm text-scale-1000">
          Attach files by dragging &amp; dropping them.
        </span>
      </div>
    </div>
  )
}
