import { IconChevronRight } from 'ui'
import Link from 'next/link'

function TextLink({ url = '', label, ...props }: any) {
  return (
    <Link
      href={url}
      className="text-foreground-light hover:text-foreground mt-3 block cursor-pointer text-sm"
      {...props}
    >
      <div className="group flex items-center gap-1">
        <span className="sr-only">{`${label} about ${url}`}</span>
        <span>{label}</span>
        <div className="transition-all group-hover:ml-0.5">
          <IconChevronRight size={14} strokeWidth={2} />
        </div>
      </div>
    </Link>
  )
}

export default TextLink
