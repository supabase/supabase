import Link from 'next/link'
import React from 'react'

const PartnerLinkBox = ({
  href,
  title,
  description,
  icon,
  color = 'amber',
}: {
  href: string
  title: string
  description: string
  icon?: React.ReactNode
  color?: 'amber' | 'brand' | 'blue'
}) => {
  const colors = {
    amber:
      'bg-amber-400 dark:bg-scale-100 group-hover:bg-amber-500 dark:group-hover:bg-amber-300 text-amber-900',
    blue: 'bg-blue-400 dark:bg-scale-100 group-hover:bg-blue-500 dark:group-hover:bg-blue-300 text-blue-900',
    brand:
      'bg-brand-400 dark:bg-scale-100 group-hover:bg-brand-500 dark:group-hover:bg-brand-300 text-brand-900',
  }

  const content = (
    <div
      className="
        hover:bg-scale-300
        bg-scale-200
        border-scale-500
        dark:border-scale-400 group cursor-pointer rounded 
        border px-5 py-4 
        "
    >
      <div className="flex flex-col gap-3">
        <div
          className={`${colors[color]}
            flex h-8 w-8
            items-center justify-center rounded-md
            transition-all
            group-hover:scale-110
            `}
        >
          {icon}
        </div>
        <div>
          <h5 className="text-scale-1200 mb-2 text-base">{title}</h5>
          <p className="p text-sm">{description}</p>
        </div>
      </div>
    </div>
  )

  return <Link href={href}>{content}</Link>
}

export default PartnerLinkBox
