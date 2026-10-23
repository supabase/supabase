import { DitheredSkeletonGif } from 'ui'

export default function DitheredSkeletonGifDemo() {
  return (
    <div className="flex flex-col gap-3">
      <DitheredSkeletonGif className="h-[125px] w-[250px] rounded-xl" />
      <div className="flex flex-col gap-2">
        <DitheredSkeletonGif className="h-4 w-[250px]" />
        <DitheredSkeletonGif className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
