'use client'

import { useRouter } from 'next/navigation'
import { Button, TextArea_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { NewHeader, NewHeaderDescription, NewHeaderTitle } from '../new-header'

export default function NewOrganization() {
  const router = useRouter()
  return (
    <div key="add-members" className="flex flex-col w-[380px] gap-10 mx-auto py-20">
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
        <Button size="small" className="" onClick={() => router.push('/new/project')}>
          Continue
        </Button>
      </div>
    </div>
  )
}
