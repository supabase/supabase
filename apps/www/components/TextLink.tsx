import { IconArrowRight, IconChevronRight } from '@supabase/ui'
import Link from 'next/link'

function TextLink({ url, label }: any) {
  return (
    <a
      href={url}
      className="block text-sm text-scale-1100 hover:text-scale-1200 mt-3 cursor-pointer"
    >
      <div className="flex items-center gap-1 group">
        <span>{label}</span>
        <div className="transition-all group-hover:ml-0.5">
          <IconChevronRight size={14} strokeWidth={2} />
        </div>
      </div>
    </a>
  )
}

export default TextLink
