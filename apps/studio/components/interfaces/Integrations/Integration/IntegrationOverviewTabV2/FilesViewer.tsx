import { useState } from 'react'
import { cn } from 'ui'

export const FilesViewer = ({ files }: { files: string[] }) => {
  const [selected, setSelected] = useState(files[0])

  return (
    <div className="flex flex-col gap-y-4">
      <img alt={selected} src={selected} className="rounded-md border" />
      {files.length > 1 && (
        <div className="grid grid-cols-10 gap-x-2">
          {files.map((x) => (
            <button key={x} onClick={() => setSelected(x)}>
              <img
                alt={x}
                src={x}
                className={cn(
                  'col-span-1 bg-surface-100 rounded-md object-cover aspect-square border transition',
                  selected === x ? 'border-stronger' : 'border-secondary'
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
