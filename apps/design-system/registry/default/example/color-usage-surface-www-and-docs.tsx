import { ClassLabel } from '@/components/class-label'
import { ExampleLabel } from '@/components/example-label'
import * as React from 'react'

export default function Demo() {
  return (
    <div className="bg w-full h-[320px] flex justify-center items-center gap-12 border border-dashed rounded-md">
      <div className="flex gap-3 items-center">
        <ExampleLabel>app background</ExampleLabel>
        <ClassLabel>bg</ClassLabel>
      </div>
      <div className="bg-surface-75 border border-muted h-32 w-1/2 rounded-md flex justify-center gap-3 items-center">
        <ExampleLabel>content panel</ExampleLabel>
        <ClassLabel>bg-surface-75</ClassLabel>
        <ClassLabel>border-muted</ClassLabel>
      </div>
    </div>
  )
}
