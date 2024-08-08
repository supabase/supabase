import { ClassLabel } from '@/components/class-label'
import { ExampleLabel } from '@/components/example-label'
import * as React from 'react'

export default function Demo() {
  return (
    <div className="bg-studio w-full h-[320px] flex justify-center items-center gap-12 border border-dashed rounded-md p-3">
      <div className="flex gap-3 items-center">
        <ExampleLabel>app background</ExampleLabel>
        <ClassLabel>bg-studio</ClassLabel>
      </div>
      <div className="bg-surface-100 border h-full w-[400px] rounded-md flex justify-center gap-10 items-center flex-col p-3">
        <div className="flex gap-3">
          <ExampleLabel>content panel</ExampleLabel>
          <ClassLabel>bg-surface-100</ClassLabel>
          <ClassLabel>border</ClassLabel>
        </div>
        <div className="bg-surface-200 border h-48 w-full rounded-md flex  gap-10 items-center flex-col p-3 pt-10">
          <div className="flex gap-3">
            <ExampleLabel>content panel</ExampleLabel>
            <ClassLabel>bg-surface-200</ClassLabel>
            <ClassLabel>border</ClassLabel>
          </div>

          <div className="bg-surface-300 border h-32 w-full rounded-md flex justify-center gap-3 items-center">
            <div className="flex gap-3">
              <ExampleLabel>content panel</ExampleLabel>
              <ClassLabel>bg-surface-300</ClassLabel>
              <ClassLabel>border</ClassLabel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
