import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from 'ui'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  return (
    <div className={cn('flex items-center space-x-2 text-sm text-foreground-light', className)}>
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center">
          {index > 0 && <ChevronRight size={14} strokeWidth={1.5} className="mx-2" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition">
              {item.label}
            </Link>
          ) : item.onClick ? (
            <button className="hover:text-foreground transition" onClick={item.onClick}>
              {item.label}
            </button>
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default Breadcrumbs
