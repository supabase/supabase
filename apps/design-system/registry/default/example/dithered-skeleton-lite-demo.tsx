import { DitheredSkeletonLite } from 'ui'

export default function DitheredSkeletonLiteDemo() {
  return (
    <div className="flex flex-col gap-3">
      <DitheredSkeletonLite className="h-[125px] w-[250px] rounded-xl" />
      <div className="flex flex-col gap-2">
        <DitheredSkeletonLite className="h-4 w-[250px]" />
        <DitheredSkeletonLite className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
