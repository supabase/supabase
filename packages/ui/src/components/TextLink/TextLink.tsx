import { IconChevronRight } from 'ui'
import Link from 'next/link'

function TextLink({ url = '', label, ...props }: any) {
  return (
    <Link href={url} passHref>
      <a
        className="text-scale-1100 hover:text-scale-1200 mt-3 block cursor-pointer text-sm"
        {...props}
      >
        <div className="group flex items-center gap-1">
          <span className="sr-only">{`${label} about ${url}`}</span>
          <span>{label}</span>
          <div className="transition-all group-hover:ml-0.5">
            <IconChevronRight size={14} strokeWidth={2} />
          </div>
        </div>
      </a>
    </Link>
  )
}

export default TextLink
