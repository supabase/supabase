import { ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { ElementRef, forwardRef } from 'react'
import {
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconChevronsDown,
  Input_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import ShimmeringLoader from '../ShimmeringLoader'

const InnerSideMenuCollapsible = forwardRef<
  ElementRef<typeof Collapsible_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof Collapsible_Shadcn_>
>(({ ...props }, ref) => {
  return <Collapsible_Shadcn_ {...props} className={cn('w-full px-2 py-3', props.className)} />
})

const InnerSideMenuCollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsibleTrigger_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CollapsibleTrigger_Shadcn_>
>(({ ...props }, ref) => {
  return (
    <CollapsibleTrigger_Shadcn_
      ref={ref}
      {...props}
      className={cn(
        'w-full flex gap-1 items-center group px-2 text-xs font-mono font-normal uppercase text-lighter tracking-wide',
        props.className
      )}
    >
      <ChevronRight
        className="transition-all text-foreground-muted group-data-[state=open]:rotate-90"
        size={16}
        strokeWidth={1.5}
      />
      <span className="group-hover:text-foreground">{props.title}</span>
    </CollapsibleTrigger_Shadcn_>
  )
})

const InnerSideMenuCollapsibleContent = forwardRef<
  ElementRef<typeof CollapsibleContent_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CollapsibleContent_Shadcn_>
>(({ ...props }, ref) => {
  return (
    <CollapsibleContent_Shadcn_
      {...props}
      className={cn('w-full data-[state=open]:py-2 flex flex-col gap-2', props.className)}
    />
  )
})

const InnerSideMenuSeparator = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  (props, ref) => {
    return <div ref={ref} {...props} className={cn('h-px bg-border-muted', props.className)} />
  }
)

const InnerSideMenuItem = forwardRef<
  ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & {
    isActive?: boolean
    forceHoverState?: boolean | null
  }
>(({ className, isActive, forceHoverState, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      {...props}
      aria-current={isActive}
      className={cn(
        'text-sm',
        'h-7 pl-3 pr-2',
        'flex items-center justify-between rounded-md group relative',
        isActive ? 'bg-selection' : 'hover:bg-surface-200',
        forceHoverState && 'bg-surface-200',
        isActive ? 'text-foreground' : 'text-foreground-light hover:text-foreground',
        className
      )}
    />
  )
})

const InnerSideBarFilters = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  (props, ref) => {
    return (
      <div ref={ref} {...props} className={cn('flex px-2 gap-2 items-center', props.className)} />
    )
  }
)

const InnerSideBarFilterSearchInput = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'> & { 'aria-labelledby': string; name: string }
>(({ ...props }, ref) => {
  return (
    <label htmlFor={props.name} className="relative w-full">
      <span className="sr-only">{props['aria-labelledby']}</span>
      <Input_Shadcn_
        ref={ref}
        type="text"
        className={cn('h-[28px] w-full', 'text-xs', 'pl-7', 'w-full', props.className)}
        {...props}
      />
      <Search className="absolute left-2 top-2 text-foreground-muted" size={14} strokeWidth={1.5} />
    </label>
  )
})

const InnerSideBarFilterSortDropdown = forwardRef<
  ElementRef<typeof DropdownMenu>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu> & {
    value: string
    onValueChange: (value: string) => void
    contentClassName?: string
  }
>(({ value, onValueChange, contentClassName, ...props }, ref) => {
  return (
    <DropdownMenu>
      <Tooltip_Shadcn_ delayDuration={0}>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger_Shadcn_ className="text-foreground-lighter transition-colors hover:text-foreground data-[state=open]:text-foreground">
            <IconChevronsDown size={18} strokeWidth={1} />
          </TooltipTrigger_Shadcn_>
        </DropdownMenuTrigger>
        <TooltipContent_Shadcn_ side="bottom">Sort By</TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
      <DropdownMenuContent side="bottom" align="end" className={cn('w-16', contentClassName)}>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {props.children}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const InnerSideBarFilterSortDropdownItem = forwardRef<
  ElementRef<typeof DropdownMenuRadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuRadioItem>
>((props, ref) => {
  return <DropdownMenuRadioItem ref={ref} {...props} />
})

const InnerSideBarShimmeringLoaders = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>((props, ref) => {
  return (
    <div ref={ref} {...props} className={cn('flex flex-col px-2 gap-1 pb-4', props.className)}>
      <ShimmeringLoader className="w-full h-7 rounded-md" delayIndex={0} />
      <ShimmeringLoader className="w-full h-7 rounded-md" delayIndex={1} />
      <ShimmeringLoader className="w-full h-7 rounded-md" delayIndex={2} />
    </div>
  )
})

export {
  InnerSideBarFilterSearchInput,
  InnerSideBarFilters,
  InnerSideBarShimmeringLoaders,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuItem,
  InnerSideMenuSeparator,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
}
