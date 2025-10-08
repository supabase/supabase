import * as React from 'react'

import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

export default function SelectDemo() {
  return (
    <Select_Shadcn_>
      <SelectTrigger_Shadcn_ className="w-[180px]">
        <SelectValue_Shadcn_ placeholder="Select a fruit" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        <SelectGroup_Shadcn_>
          <SelectLabel_Shadcn_>Fruits</SelectLabel_Shadcn_>
          <SelectItem_Shadcn_ value="apple">Apple</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="banana">Banana</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="blueberry">Blueberry</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="grapes">Grapes</SelectItem_Shadcn_>
          <SelectItem_Shadcn_ value="pineapple">Pineapple</SelectItem_Shadcn_>
        </SelectGroup_Shadcn_>
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
