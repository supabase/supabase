'use client'

import { Button, Separator, Badge } from 'ui'
import { NewHeader, NewHeaderDescription, NewHeaderTitle } from '../new-header'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ChevronsUpDown, Flag, Slash } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NewProject() {
  const router = useRouter()
  return (
    <>
      <div
        key="new-project"
        className="flex flex-col max-w-[600px] gap-10 mx-auto px-5 pt-20 pb-32"
      >
        <NewHeader>
          <NewHeaderTitle>Create your first project</NewHeaderTitle>
          {/* <NewHeaderDescription>Instantly create a Postgres backend</NewHeaderDescription> */}
        </NewHeader>
        <Separator />
        <div className="flex gap-2 w-full">
          <FormItemLayout isReactForm={false} label="Organization">
            <Button
              size="small"
              iconRight={<ChevronsUpDown />}
              type="default"
              className="w-48 flex justify-between"
            >
              Your new org
            </Button>
          </FormItemLayout>
          <span className="text-foreground-muted flex">
            <Slash className="self-end mb-4 transform rotate-[-23deg]" strokeWidth={1} />
          </span>
          <FormItemLayout
            isReactForm={false}
            label="Project name"
            FormItemProps={{ className: 'grow' }}
          >
            <Input size="small" className="w-full" placeholder="Name of project" />
          </FormItemLayout>
        </div>
        <div>
          <FormItemLayout
            isReactForm={false}
            label="Region"
            description="Select the region closest to your users for the best performance."
          >
            <Button
              size="small"
              iconRight={<ChevronsUpDown />}
              type="default"
              className="flex justify-between w-80 [&_span]:w-full"
              icon={<Flag />}
            >
              <span className="flex w-full text-left gap-2">
                Singapore <span className="text-foreground-lighter"> | South East Asia</span>
              </span>
            </Button>
          </FormItemLayout>
        </div>
        <div>
          <FormItemLayout
            isReactForm={false}
            label="Compute size"
            description="Select the compute size for your dedicated database. You can always change this later."
          >
            <Button
              size="small"
              iconRight={<ChevronsUpDown />}
              type="default"
              className="flex justify-between w-128"
            >
              <span className="flex w-full gap-2 items-center justify-start">
                <Badge className="bg-dash-sidebar bg-opacity-100">Micro</Badge>
                <span className="text-foreground-muted">|</span>
                <span className="text-foreground-lighter">
                  2 Core ARM CPU | 1 GB RAM $10.00/month
                </span>
              </span>
            </Button>
          </FormItemLayout>
        </div>
        <div className="text-foreground-light flex flex-col gap-3 text-sm">
          <div className="flex gap-2">
            <h5 className="text-base text-foreground">Monthly compute cost</h5>
            <h5 className="text-base text-brand">$0</h5>
          </div>
          <p>Your monthly spend will not increase, unless you exceed your plans included quota.</p>
          <p>
            Your organisation includes $10/month of compute credits which means the compute cost per
            month is reduced to $0/month.
          </p>
        </div>
        <Separator />
        <div className="text-foreground-light flex flex-col gap-3 text-sm">
          <div className="flex gap-2">
            <h5 className="text-base text-foreground">Database security</h5>
          </div>
          <p>Your monthly spend will not increase, unless you exceed your plans included quota.</p>
          <p>
            Your organisation includes $10/month of compute credits which means the compute cost per
            month is reduced to $0/month.
          </p>
        </div>
        <FormItemLayout
          isReactForm={false}
          label="Database password"
          description="This is the password to your postgres database, so it must be strong and hard to guess. Generate a password."
        >
          <div className="flex items-center gap-2">
            <Input
              size="small"
              type="default"
              className="flex justify-between w-[300px]"
              placeholder="Strong password..."
            />

            <Button size="small" type="default">
              Generate password
            </Button>
          </div>
        </FormItemLayout>
      </div>
      <div className="sticky bottom-0 w-full bg-200 border-t border-dash-border h-16 flex items-center">
        <div className="flex w-[600px] gap-10 px-5 mx-auto justify-end">
          <Button size="small" onClick={() => router.push('/summersmuir/projects')}>
            Create project
          </Button>
        </div>
      </div>
    </>
  )
}
