'use client'

import { cn } from '@/lib/utils'
import { UseSupabaseUploadReturn } from '@/registry/default/blocks/dropzone/hooks/use-supabase-upload'
import { Button } from '@/registry/default/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/default/components/ui/tooltip'
import { CheckCircle, CircleAlert, File, Loader2, Trash, Upload } from 'lucide-react'
import { createContext, PropsWithChildren, useCallback, useContext } from 'react'

type DropzoneContextType = Omit<UseSupabaseUploadReturn, 'getRootProps' | 'getInputProps'>

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined)

type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string
}

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isActive = restProps.isDragActive
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    restProps.error ||
    restProps.files.some((file) => file.errors.length !== 0)

  return (
    <DropzoneContext.Provider value={{ ...restProps }}>
      <div
        {...getRootProps({
          className: cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-card transition-colors duration-300',
            className,
            isActive && 'border-primary bg-primary/10',
            isInvalid && 'border-destructive bg-destructive/10'
          ),
        })}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </DropzoneContext.Provider>
  )
}
const DropzoneContent = ({ className }: { className?: string }) => {
  const { error, files, setFiles, onUpload, loading, success } = useDropzoneContext()

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file) => file.name !== fileName))
    },
    [files, setFiles]
  )

  if (success) {
    return (
      <div className={cn('flex flex-row items-center gap-1 justify-center', className)}>
        <CheckCircle className="text-primary text-lg font-medium" />
        <p className="text-primary text-lg font-medium">Files uploaded successfully</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {files.map((file) => {
        return (
          <div
            key={file.name}
            className="flex items-center gap-2 border-b p-2 first:mt-4 last:mb-4 "
          >
            {file.type.startsWith('image/') ? (
              <div className="h-12 w-12 rounded border overflow-hidden flex-shrink-0 bg-muted">
                <img src={file.preview} alt={file.name} className="object-cover" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center">
                <File />
              </div>
            )}
            <div className="grow flex items-center gap-2 justify-start">
              <span className="text-sm">{file.name}</span>
              {file.errors.length !== 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleAlert className="text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>{file.errors.map((e) => e.message).join(', ')}</TooltipContent>
                </Tooltip>
              )}
            </div>

            <Button
              size="icon"
              variant="destructive"
              className="justify-self-end"
              onClick={() => handleRemoveFile(file.name)}
            >
              <Trash />
            </Button>
          </div>
        )
      })}
      {files.length > 0 && (
        <div className="mt-2">
          <Button
            variant="default"
            onClick={onUpload}
            disabled={files.some((file) => file.errors.length !== 0) || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload</>
            )}
          </Button>
        </div>
      )}
      {error && <p className="text-destructive text-lg font-medium">{error}</p>}
    </div>
  )
}

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { files, maxFiles, maxFileSize, inputRef, success } = useDropzoneContext()

  if ((maxFiles !== 0 && files.length >= maxFiles) || success) {
    return null
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="rounded-full bg-primary text-primary-foreground p-2">
        <Upload />
      </div>
      <p className="text-lg font-medium">
        Add or{' '}
        <a onClick={() => inputRef.current?.click()} className="underline cursor-pointer">
          drop {maxFiles === 1 ? `file` : 'files'}
        </a>
      </p>
      {maxFileSize !== Number.POSITIVE_INFINITY && (
        <p className="text-sm text-muted-foreground mt-2">Maximum file size: {maxFileSize} MB</p>
      )}
    </div>
  )
}

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext)

  if (!context) {
    throw new Error('useDropzoneContext must be used within a Dropzone')
  }

  return context
}

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext }
