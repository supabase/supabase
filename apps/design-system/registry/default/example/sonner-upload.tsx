import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Progress } from 'ui'

export default function SonnerUpload() {
  const uploadPromise = (files: number, toastId: number) => {
    toast.loading(<UploadContent progress={0} files={files} />, {
      id: toastId,
    })

    return new Promise((resolve) => {
      let currentProgress = 0

      toast.loading(<UploadContent progress={currentProgress} files={files} />, {
        id: toastId,
      })

      const intervalId = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 1 // Increment progress by a random value
        if (currentProgress > 100) currentProgress = 100 // Ensure progress does not exceed 100%

        if (currentProgress >= 100) {
          clearInterval(intervalId) // Clear the interval once upload is complete
          resolve({ progress: currentProgress, message: 'Upload complete', files: 3, toastId }) // Resolve the promise when progress reaches 100
        }

        toast.loading(<UploadContent progress={currentProgress} files={files} />, {
          id: toastId,
        })
      }, 200) // Adjust the interval time as needed
    })
  }

  const UploadContent = ({ progress, files }: { progress: number; files: number }) => (
    <div className="flex gap-3 w-full">
      {progress >= 100 ? (
        <Check className="text-foreground mt-0.5" size={16} strokeWidth={4} />
      ) : (
        <Loader2 className="animate-spin text-foreground-muted mt-0.5" size={16} />
      )}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex w-full justify-between">
          <p className="text-foreground text-sm">
            {progress >= 100
              ? `Upload complete`
              : files
                ? `Uploading ${files} files...`
                : `Uploading...`}
          </p>
          <p className="text-foreground-light text-sm font-mono">{`${progress}%`}</p>
        </div>
        <Progress value={progress} className="w-full" />
        <small className="text-foreground-muted text-xs">
          Please do not close the browser until completed
        </small>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="default"
        onClick={async () => {
          // random id
          const toastId = Math.random()
          const max = 20 // specify the maximum value
          const files = Math.floor(Math.random() * max)
          try {
            const promise = await uploadPromise(files, toastId)
            // @ts-expect-error
            toast.success(<UploadContent progress={promise.progress} files={promise.files} />, {
              duration: 2000,
              id: toastId,
            })
          } catch (error) {}
        }}
      >
        Start upload
      </Button>
    </div>
  )
}
