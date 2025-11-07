import { ClassLabel } from '@/components/class-label'
import { ExampleLabel } from '@/components/example-label'
import * as React from 'react'

export default function Demo() {
  return (
    <div className="bg-studio w-full h-[320px] flex flex-col items-center border border-dashed rounded-md overflow-hidden">
      <div className="bg-surface-200 border h-12 w-full rounded-t-md flex justify-center gap-3 items-center shadow">
        <div className="flex gap-3">
          <ExampleLabel>grid header</ExampleLabel>
          <ClassLabel>bg-surface-200</ClassLabel>
          <ClassLabel>border</ClassLabel>
        </div>
      </div>
      <div className="bg-200 border-b border-r border-l border-secondary h-14 w-full flex justify-center gap-3 items-center shadow">
        <div className="flex gap-3">
          <ExampleLabel>content row</ExampleLabel>
          <ClassLabel>bg-200</ClassLabel>
          <ClassLabel>border-secondary</ClassLabel>
        </div>
      </div>
      <div className="bg-200 border-b border-r border-l border-secondary h-14 w-full flex justify-center gap-3 items-center shadow">
        <div className="flex gap-3">
          <ExampleLabel>content row</ExampleLabel>
          <ClassLabel>bg-200</ClassLabel>
          <ClassLabel>border-secondary</ClassLabel>
        </div>
      </div>
      <div className="bg-200 border-b border-r border-l border-secondary h-14 w-full flex justify-center gap-3 items-center shadow">
        <div className="flex gap-3">
          <ExampleLabel>content row</ExampleLabel>
          <ClassLabel>bg-200</ClassLabel>
          <ClassLabel>border-secondary</ClassLabel>
        </div>
      </div>
      <div className="bg-200 border-b border-r border-l border-secondary h-14 w-full flex justify-center gap-3 items-center shadow">
        <div className="flex gap-3">
          <ExampleLabel>content row</ExampleLabel>
          <ClassLabel>bg-200</ClassLabel>
          <ClassLabel>border-secondary</ClassLabel>
        </div>
      </div>
      <div className="flex bg-alternative w-full justify-center items-center h-full gap-3">
        <ExampleLabel>empty frame space</ExampleLabel>
        <ClassLabel>bg-alternative</ClassLabel>
        <ClassLabel>border-stronger</ClassLabel>
      </div>
    </div>
  )
}
