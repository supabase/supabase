'use client'

import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { NewHeader, NewHeaderDescription, NewHeaderTitle } from './new-header'
import { useRouter } from 'next/navigation'

export default function NewOrganization() {
  const router = useRouter()

  return (
    <div className="flex flex-col w-[380px] gap-10">
      <NewHeader>
        <NewHeaderTitle>Create your first organization</NewHeaderTitle>
        <NewHeaderDescription>
          <p>Organizations are shared environments where teams can work on projects.</p>
          <p>Invite some co-workers to test Supabase with.</p>
        </NewHeaderDescription>
      </NewHeader>
      <div className="bg-200">
        <div className="px-8 py-10 bg-studio w-full border rounded-t-md">
          <FormItemLayout label="Organization name" isReactForm={false}>
            <Input placeholder="Organization name" />
          </FormItemLayout>
        </div>
        <div className="px-8 py-10 bg-dash-canvas w-full border-l border-r border-b rounded-b-md flex flex-col gap-8">
          <div className="text-sm flex flex-col">
            <span className="text-foreground-light">
              Optional questions you dont need to answer.
            </span>
            <span className="text-foreground-muted">But it helps us a little bit.</span>
          </div>
          <div className="flex flex-col gap-3">
            <FormItemLayout label="Describe your organization" isReactForm={false}>
              <Select_Shadcn_>
                <SelectTrigger_Shadcn_>
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
            </FormItemLayout>
            <FormItemLayout label="How large is this organization" isReactForm={false}>
              <Select_Shadcn_>
                <SelectTrigger_Shadcn_>
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
            </FormItemLayout>
          </div>
        </div>
      </div>
      <div className="w-full flex justify-end">
        <Button size="small" className="" onClick={() => router.push('/new/add-members')}>
          Continue
        </Button>
      </div>
    </div>
  )
}
