import { DitheredSkeletonGif } from 'ui'

const ROWS = ['w-40', 'w-32', 'w-48', 'w-36']

export default function DitheredSkeletonGifList() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y rounded-lg border">
      {ROWS.map((width, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          <DitheredSkeletonGif className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <DitheredSkeletonGif className={`h-3.5 ${width}`} />
            <DitheredSkeletonGif className="h-3 w-24" />
          </div>
          <DitheredSkeletonGif className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}
