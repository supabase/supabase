import { Input, RadioGroupLargeItem_Shadcn_, RadioGroup_Shadcn_ } from 'ui'

export const PolicyDetailsV2 = () => {
  return (
    <div className="px-5 py-5 flex flex-col gap-y-4 border-b">
      <div className="flex items-center justify-between gap-4 grid grid-cols-12">
        <Input size="small" label="Policy name" className="col-span-6" />
        <Input size="small" label="Table" className="col-span-6" />
        <Input size="small" label="Policy Behaviour" className="col-span-6" />
        <div className="col-span-12 flex flex-col gap-y-2">
          <label className="block text-foreground-light text-sm leading-4">Policy Command</label>
          <RadioGroup_Shadcn_
            name="theme"
            onValueChange={() => {}}
            aria-label="Choose a theme"
            defaultValue={undefined}
            value={undefined}
            className="grid grid-cols-10 gap-3"
          >
            <RadioGroupLargeItem_Shadcn_
              value="SELECT"
              label="SELECT"
              className="col-span-2 w-auto"
            />
            <RadioGroupLargeItem_Shadcn_
              value="SELECT"
              label="SELECT"
              className="col-span-2 w-auto"
            />
            <RadioGroupLargeItem_Shadcn_
              value="SELECT"
              label="SELECT"
              className="col-span-2 w-auto"
            />
            <RadioGroupLargeItem_Shadcn_
              value="SELECT"
              label="SELECT"
              className="col-span-2 w-auto"
            />
            <RadioGroupLargeItem_Shadcn_
              value="SELECT"
              label="SELECT"
              className="col-span-2 w-auto"
            />
          </RadioGroup_Shadcn_>
        </div>
        <Input size="small" label="Role Specification" className="col-span-6" />
      </div>
    </div>
  )
}
