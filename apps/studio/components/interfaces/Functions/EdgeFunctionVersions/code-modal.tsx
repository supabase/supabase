import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
} from 'ui'

type CodeFile = {
  path: string
  content: string
}

type CodeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: number | null
  files: CodeFile[]
  isLoading: boolean
}

export const CodeModal = ({ open, onOpenChange, version, files, isLoading }: CodeModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Version {version}
            <Badge variant="secondary">Code preview</Badge>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading code…</div>
            ) : files.length === 0 ? (
              <div className="text-sm text-muted-foreground">No files found for this version.</div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.path} className="space-y-2">
                    <div className="text-xs text-muted-foreground">{file.path}</div>
                    <pre className="max-h-[50vh] overflow-auto rounded border bg-muted p-3 text-xs">
                      <code>{file.content}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
