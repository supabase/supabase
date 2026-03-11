'use client'

import { Input_Shadcn_, Label_Shadcn_ } from 'ui'

export default function CopyFormLabels() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 w-[300px]">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="grid w-full items-center gap-1.5">
          <Label_Shadcn_ htmlFor="table-name-bad">Name your table</Label_Shadcn_>
          <Input_Shadcn_ id="table-name-bad" placeholder="my_table" />
          <p className="text-sm text-muted-foreground">
            This field allows you to specify a name for your table using letters, numbers, and
            underscores
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-[300px]">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="grid w-full items-center gap-1.5">
          <Label_Shadcn_ htmlFor="table-name-good">Table name</Label_Shadcn_>
          <Input_Shadcn_ id="table-name-good" placeholder="my_table" />
          <p className="text-sm text-muted-foreground">Letters, numbers, and underscores only</p>
        </div>
      </div>
    </div>
  )
}
