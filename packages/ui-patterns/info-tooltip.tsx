import { ElementRef, forwardRef } from 'react'
import { TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

const SVG = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    <path
      fill-rule="evenodd"
      d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z"
      clip-rule="evenodd"
    />
  </svg>
))

const InfoTooltip = forwardRef<
  ElementRef<typeof TooltipContent_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof TooltipContent_Shadcn_>
>(({ ...props }, ref) => {
  return (
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_
        type="button"
        role="button"
        className="flex [&_svg]:data-[state=delayed-open]:fill-foreground-lighter [&_svg]:data-[state=instant-open]:fill-foreground-lighter"
      >
        <SVG strokeWidth={2} className="transition-colors fill-foreground-muted w-4 h-4" />
      </TooltipTrigger_Shadcn_>
      <TooltipContent_Shadcn_ {...props} />
    </Tooltip_Shadcn_>
  )
})

export { InfoTooltip }
