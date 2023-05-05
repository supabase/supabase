import { PropsWithChildren } from 'react'
import { Badge, Button, IconExternalLink } from 'ui'
import { CategoryAttribute } from './Usage.constants'
import Link from 'next/link'

export interface SectionContent {
  section: CategoryAttribute
  includedInPlan?: boolean
  lastKnownValue?: string
}

const SectionContent = ({
  section,
  includedInPlan,
  lastKnownValue,
  children,
}: PropsWithChildren<SectionContent>) => {
  const { name, description, docsUrl } = section

  return (
    <div className="border-b">
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <div className="sticky top-16 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="text-base capitalize">{name}</p>
                  {includedInPlan === false && <Badge color="gray">Not included</Badge>}
                </div>
                {description.split('\n').map((value, idx) => (
                  <p key={`desc-${idx}`} className="text-sm text-scale-1000">
                    {value}
                  </p>
                ))}
              </div>
              {docsUrl !== undefined && (
                <div>
                  <p className="text-sm text-scale-1100 mb-2">More information</p>
                  <Link href={docsUrl}>
                    <a target="_blank" rel="noreferrer">
                      <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                        <p className="text-sm">Documentation</p>
                        <IconExternalLink size={16} strokeWidth={2} />
                      </div>
                    </a>
                  </Link>
                </div>
              )}
              {lastKnownValue !== undefined && (
                <p className="text-xs text-scale-1000">Last updated at: {lastKnownValue}</p>
              )}
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default SectionContent
