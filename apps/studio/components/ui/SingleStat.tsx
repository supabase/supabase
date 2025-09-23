import Link from 'next/link'
import type { ReactNode } from 'react'

type SingleStatProps = {
  icon: ReactNode
  label: ReactNode
  value: ReactNode
  className?: string
  href?: string
  onClick?: () => void
}

export const SingleStat = ({ icon, label, value, className, href, onClick }: SingleStatProps) => {
  const content = (
    <div className={`group flex items-center gap-4 p-0 text-base justify-start ${className || ''}`}>
      <div className="w-16 h-16 rounded-md bg-surface-75 group-hover:bg-muted border flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-left heading-meta text-foreground-light">{label}</div>
        <div className="text-foreground truncate h-[34px] flex items-center capitalize-sentence">
          {value}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link className="group block" href={href}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className="group" onClick={onClick}>
        {content}
      </button>
    )
  }

  return content
}
