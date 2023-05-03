import { PropsWithChildren } from 'react'
import { Badge } from 'ui'

export interface SectionContent {
  title: string
  description: string
  includedInPlan?: boolean
}

const SectionContent = ({
  title,
  description,
  includedInPlan,
  children,
}: PropsWithChildren<SectionContent>) => {
  return (
    <div className="border-b">
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-5">
            <div className="sticky top-16 space-y-1">
              <div className="flex items-center space-x-2">
                <p className="text-base capitalize">{title}</p>
                {includedInPlan === false && <Badge color="gray">Not included</Badge>}
              </div>
              {description.split('\n').map((value, idx) => (
                <p key={`desc-${idx}`} className="text-sm text-scale-1000">
                  {value}
                </p>
              ))}
              {/* [Joshen] Feels a little too wordy if include below CTA */}
              {/* {includedInPlan === false && (
                <p className="text-sm text-scale-1000">
                  Upgrade your project to have access to <span className="lowercase">{title}</span>
                </p>
              )} */}
            </div>
          </div>
          <div className="col-span-7 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default SectionContent
