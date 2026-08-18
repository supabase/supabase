import { forwardRef, type SVGAttributes } from 'react'
import { cn } from 'ui'

interface BroomSparklesIconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  size?: number | string
}

/**
 * Inline copy of Lucide's `broom-sparkles` icon. The version of `lucide-react`
 * pinned in Studio (`^0.436.0`) predates this icon, so we ship the SVG paths
 * directly rather than pull in a mixed-version import. Sized and colored the
 * same as a `lucide-react` icon (`size` prop, `currentColor` stroke) so it
 * drops in wherever an icon component would.
 */
export const BroomSparklesIcon = forwardRef<SVGSVGElement, BroomSparklesIconProps>(
  ({ size = 16, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('lucide lucide-broom-sparkles', className)}
      {...props}
    >
      <path d="M11 2v2" />
      <path d="M12 3h-2" />
      <path d="M13.5 10.5 22 2" />
      <path d="M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z" />
      <path d="M20 15v4" />
      <path d="M22 17h-4" />
      <path d="M4 4v4" />
      <path d="m5 18 2-2" />
      <path d="M6 6H2" />
      <path d="m7.699 10.7 5.602 5.601" />
    </svg>
  )
)
BroomSparklesIcon.displayName = 'BroomSparklesIcon'
