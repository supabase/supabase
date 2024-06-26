'use client'

import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  Button,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { NewHeader, NewHeaderDescription, NewHeaderTitle } from '../new-header'
import { TextArea } from '@ui/components/shadcn/ui/text-area'

export default function NewOrganization() {
  return (
    <div className="flex flex-col w-[380px] gap-10">
      <NewHeader>
        <NewHeaderTitle>Invite your co-workers</NewHeaderTitle>
        <NewHeaderDescription>
          <p>Supabase can be worked on with multiple people, or just you alone.</p>
          <p>Invite some co-workers to test Supabase with.</p>
        </NewHeaderDescription>
      </NewHeader>
      <div className="bg-200">
        <div className="px-8 py-10 bg-studio w-full border rounded-t-md">
          <FormItemLayout label="Email addresses" isReactForm={false}>
            <TextArea_Shadcn_ placeholder="ant@acme.com, copple@acme.io..." />
          </FormItemLayout>
        </div>
        <div className="px-8 py-4 bg-dash-canvas w-full border-l border-r border-b rounded-b-md flex flex-col gap-8">
          <div className="text-sm flex flex-col">
            <span className="text-foreground-light">You can skip this step</span>
            <span className="text-foreground-muted">You can also invite members later</span>
          </div>
        </div>
      </div>
      <div className="w-full flex justify-end gap-2">
        <Button type="text" size="small" className="text-foreground-lighter">
          Skip adding members
        </Button>
        <Button size="small" className="">
          Continue
        </Button>
      </div>
    </div>
  )
}
