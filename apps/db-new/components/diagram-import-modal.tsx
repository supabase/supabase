import { DialogProps } from '@radix-ui/react-dialog'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import LoadingSpinner from './loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

export type DiagramImportModalProps = {
  onImport?: (sql: string) => void
} & DialogProps

export default function DiagramImportModal({ onImport, ...props }: DiagramImportModalProps) {
  const imageToSqlMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await fetch('/api/ai/sql/from-image', {
        method: 'POST',
        body: file,
      })

      const result = await response.json()
      return result
    },
  })

  const [selectedImageUrl, setSelectedImageUrl] = useState<string>()

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate SQL from a database diagram</DialogTitle>
          <ol className="list-decimal p-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <li>Draw your database diagram (on a whiteboard, napkin, etc)</li>
            <li>Snap a picture of it.</li>
            <li>Convert to SQL.</li>
          </ol>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {imageToSqlMutation.isPending ? (
            <>
              <LoadingSpinner />
              {selectedImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="rounded-md" src={selectedImageUrl} alt="Selected image" />
              )}
            </>
          ) : (
            <Input
              type="file"
              onChange={async (e) => {
                const selectedFile = e.target.files?.[0]

                if (!selectedFile) {
                  // TODO: error toast
                  return
                }

                const imageUrl = URL.createObjectURL(selectedFile)
                setSelectedImageUrl(imageUrl)

                const result = await imageToSqlMutation.mutateAsync(selectedFile)

                onImport?.(result.sql)
                props.onOpenChange?.(false)
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
