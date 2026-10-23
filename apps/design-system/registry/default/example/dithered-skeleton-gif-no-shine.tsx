import { DitheredSkeletonGif } from 'ui'

export default function DitheredSkeletonGifNoShine() {
  return (
    <div className="flex flex-col gap-3">
      <DitheredSkeletonGif shine={false} className="h-[125px] w-[250px] rounded-xl" />
      <div className="flex flex-col gap-2">
        <DitheredSkeletonGif shine={false} className="h-4 w-[250px]" />
        <DitheredSkeletonGif shine={false} className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
