import { useState } from 'react'
import { cn, Dialog, DialogContent } from 'ui'

export const FilesViewer = ({ files }: { files: string[] }) => {
  const [selected, setSelected] = useState(files[0])
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <button onClick={() => setShowDialog(true)}>
          <img
            alt={selected}
            src={selected}
            className="rounded-md border object-cover aspect-video"
          />
        </button>

        {files.length > 1 && (
          <div className="grid grid-cols-10 gap-x-2">
            {files.map((x) => (
              <button key={x} onClick={() => setSelected(x)}>
                <img
                  alt={x}
                  src={x}
                  className={cn(
                    'col-span-1 bg-surface-100 rounded-md object-cover aspect-square border transition',
                    selected === x ? 'border-button-hover' : 'border-secondary'
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent size="xxlarge">
          <img alt={selected} src={selected} className="rounded-md border" />
        </DialogContent>
      </Dialog>
    </>
  )
}
