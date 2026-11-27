import { HatchedSkeleton } from 'ui'

export default function HatchedSkeletonDemo() {
  return (
    <div className="flex flex-col gap-3">
      <HatchedSkeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="flex flex-col gap-2">
        <HatchedSkeleton className="h-4 w-[250px]" />
        <HatchedSkeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
