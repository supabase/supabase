import React from 'react'

interface Props {
  title: string | React.ReactNode
  features: { label: string; paragraph: React.ReactNode }[]
}

function GlobalPresenceSection({ title, features }: Props) {
  return (
    <div className="w-full flex flex-col xl:grid grid-cols-3 gap-8 md:gap-16">
      <p className="text-xl sm:text-2xl max-w-lg text-foreground-lighter">{title}</p>
      <div className="flex flex-col col-span-2 gap-4 md:gap-10 md:grid grid-cols-3 items-start">
        {features.map((feature) => (
          <div
            key={feature.label}
            className="w-full flex flex-col gap-1 md:gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:pl-3 md:border-l text-sm mb-1"
          >
            <p className="font-mono uppercase tracking-wide text-foreground">{feature.label}</p>
            <p className="text-foreground-lighter p-0 m-0">{feature.paragraph}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GlobalPresenceSection
