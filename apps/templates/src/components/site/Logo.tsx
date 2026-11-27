import { cn } from 'ui'
import { withBasePath } from '@/lib/base-path'

// Same wordmark swap apps/docs' HeaderLogo and apps/kb's Logo use (light/dark
// SVG pair), with a "TEMPLATES" mono label in place of "DOCS" / "KB".
export function Logo({ className }: { className?: string }) {
  return (
    <a
      href={withBasePath('/')}
      className={cn('flex w-fit shrink-0 items-center gap-1.5', className)}
    >
      <img
        className="hidden dark:block"
        src={withBasePath('/supabase-dark.svg')}
        width={96}
        height={18}
        alt="Supabase logo"
      />
      <img
        className="block dark:hidden"
        src={withBasePath('/supabase-light.svg')}
        width={96}
        height={18}
        alt="Supabase logo"
      />
      <span className="mb-px font-mono text-sm font-medium uppercase text-primary">Templates</span>
    </a>
  )
}
