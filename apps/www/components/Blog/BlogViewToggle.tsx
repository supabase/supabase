'use client'

import { setBlogViewCookie, type BlogView } from 'app/blog/blog-view'
import { motion } from 'framer-motion'
import { AlignJustify, Grid } from 'lucide-react'
import { cn } from 'ui'

export default function BlogViewToggle({
  view,
  setView,
}: {
  view: BlogView
  setView: (view: BlogView) => void
}) {
  return (
    <div className="flex items-center border border-border rounded-md p-0.5 gap-0.5 bg-surface-100">
      {(['list', 'grid'] as BlogView[]).map((v) => (
        <button
          key={v}
          onClick={() => {
            setView(v)
            setBlogViewCookie(v)
          }}
          aria-label={`${v} view`}
          aria-pressed={view === v}
          className={cn(
            'relative flex items-center justify-center w-7 h-7 rounded-sm transition-colors',
            view === v ? 'text-foreground' : 'text-foreground-light hover:text-foreground'
          )}
        >
          {view === v && (
            <motion.span
              layoutId="blog-view-bg"
              className="absolute inset-0 rounded-sm bg-surface-300 border border-border"
              transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
            />
          )}
          <span className="relative z-10">
            {v === 'list' ? (
              <AlignJustify className="w-3.5 h-3.5" />
            ) : (
              <Grid className="w-3.5 h-3.5" />
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
