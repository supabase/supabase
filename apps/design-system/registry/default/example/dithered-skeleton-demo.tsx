import { DitheredSkeleton } from 'ui'

export default function DitheredSkeletonDemo() {
  return (
    <div className="flex flex-col gap-3">
      <DitheredSkeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="flex flex-col gap-2">
        <DitheredSkeleton className="h-4 w-[250px]" />
        <DitheredSkeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
