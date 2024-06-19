'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Progress } from 'ui'

export default function SonnerUpload() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const uploadPromise = () => {
    return new Promise((resolve) => {
      let currentProgress = 0
      setIsUploading(true)
      setProgress(0)

      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 1 // Increment progress by a random value
        if (currentProgress > 100) currentProgress = 100 // Ensure progress does not exceed 100%

        setProgress((prevProgress) => {
          if (currentProgress >= 100) {
            clearInterval(interval)
            resolve({ name: 'Sonner', length: 6 }) // Resolve the promise when progress reaches 100
            setIsUploading(false)
            return currentProgress
          }
          return currentProgress
        })
      }, 750) // Adjust the interval time as needed
    })
  }

  // useEffect(() => {
  //   if (isUploading) {
  //     if (progress < 100) {
  //       toast(<UploadContent />, {
  //         id: 'upload',
  //       })
  //     }
  //   }
  //   if (progress === 100) {
  //     console.log('now at 100')
  //     toast(<UploadContent />, {
  //       id: 'upload',
  //     })

  //     // wait for 5 seconds
  //     setTimeout(() => {
  //       toast.dismiss('upload')
  //     }, 5000)
  //   }
  // }, [progress])

  const UploadContent = ({ progress }: { progress: number }) => (
    <div className="flex gap-3 w-full">
      <Loader2 className="animate-spin text-foreground-muted mt-0.5" size={16} />
      <div className="flex flex-col gap-2 w-full">
        <p className="text-foreground-light text-sm">Still uploading {progress}%</p>
        <Progress value={progress} className="w-full" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <Progress value={progress} className="w-full" />
      <Button
        type="default"
        disabled={isUploading}
        loading={isUploading}
        onClick={async () => {
          await toast(<UploadContent progress={progress} />, {
            id: 'upload',
          })

          // await toast(`Starting to upload file`, { id: 'upload' })

          // toast.promise(uploadPromise, {
          //   id: 'upload',
          //   loading: `Uploading - ${progress}%`,
          //   success: (data) => {
          //     return `Upload complete`
          //   },
          //   error: 'Error',
          // })

          // toast.custom((t) => (
          //   <div>
          //     {progress}
          //     This is a custom component <button onClick={() => toast.dismiss(t)}>close</button>
          //   </div>
          // ))
          try {
            uploadPromise()
          } catch (error) {}
        }}
      >
        Start upload
      </Button>
    </div>
  )
}
