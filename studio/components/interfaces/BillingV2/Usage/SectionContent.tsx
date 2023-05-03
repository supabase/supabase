import { PropsWithChildren } from 'react'

export interface SectionContent {
  title: string
  description: string
}

const SectionContent = ({ title, description, children }: PropsWithChildren<SectionContent>) => {
  return (
    <div className="border-b">
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-5">
            <div className="sticky top-16 space-y-1">
              <p className="text-base capitalize">{title}</p>
              {description.split('\n').map((value, idx) => (
                <p key={`desc-${idx}`} className="text-sm text-scale-1000">
                  {value}
                </p>
              ))}
            </div>
          </div>
          <div className="col-span-7 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default SectionContent
