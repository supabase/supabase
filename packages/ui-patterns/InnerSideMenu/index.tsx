import {
  // ChevronRight,
  Search,
} from 'lucide-react'
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
  return <Collapsible_Shadcn_ {...props} className={cn('w-full px-2', props.className)} />
})

const InnerSideMenuCollapsibleTrigger = forwardRef<
  ElementRef<typeof CollapsibleTrigger_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CollapsibleTrigger_Shadcn_>
>(({ ...props }, ref) => {
  return (
    <CollapsibleTrigger_Shadcn_
      disabled
      ref={ref}
      {...props}
      className={cn(
        'w-full flex gap-1 items-center group px-3 text-xs font-normal font-mono uppercase text-lighter tracking-wide',
        props.className
      )}
    >
      {/* <ChevronRight
        className="transition-all text-foreground-muted group-data-[state=open]:rotate-90"
        size={16}
        strokeWidth={1.5}
      /> */}
      <span className="group-hover:not-disabled:text-foreground">{props.title}</span>
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
      className={cn('w-full data-[state=open]:pt-1 flex flex-col gap-2', props.className)}
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
  React.ComponentPropsWithoutRef<typeof Input_Shadcn_> & { 'aria-labelledby': string; name: string }
>(({ children, ...props }, ref) => {
  return (
    <label htmlFor={props.name} className="relative w-full">
      <span className="sr-only">{props['aria-labelledby']}</span>
      <Input_Shadcn_
        ref={ref}
        type="text"
        className={cn(
          'h-[28px] w-full',
          'text-xs',
          'pl-7',
          'pr-7',
          'w-full',
          'rounded',
          // 'bg-transparent',
          // 'border',
          // 'border-control',
          props.className
        )}
        {...props}
      />
      {children}
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
    triggerClassName?: string
  }
>(({ value, onValueChange, contentClassName, triggerClassName, ...props }, ref) => {
  return (
    <DropdownMenu modal={false}>
      <Tooltip_Shadcn_ delayDuration={0}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            'absolute right-1 top-[.3rem]',
            'text-foreground-muted transition-colors hover:text-foreground data-[state=open]:text-foreground',
            triggerClassName
          )}
        >
          <TooltipTrigger_Shadcn_>
            <IconChevronsDown size={18} strokeWidth={1} />
          </TooltipTrigger_Shadcn_>
        </DropdownMenuTrigger>
        <TooltipContent_Shadcn_ side="bottom">Sort By</TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
      <DropdownMenuContent side="bottom" align="end" className={cn('w-48', contentClassName)}>
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

const InnerSideBarEmptyPanel = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    title: string
    description?: string
    illustration?: React.ReactNode
    actions?: React.ReactNode
  }
>(({ illustration, title, description, actions, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'border bg-surface-100/50 flex flex-col gap-y-3 items-center justify-center rounded-md px-3 py-4',
        props.className
      )}
    >
      <div className="flex flex-col gap-y-1 items-center justify-center">
        {illustration}
        {title && <p className="text-xs text-foreground-light">{title}</p>}
        {description && (
          <p className="text-xs text-foreground-lighter text-center">{description}</p>
        )}
        {actions && <div className="mt-2">{actions}</div>}
      </div>
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
  InnerSideBarEmptyPanel,
}
