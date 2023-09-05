import React from 'react'
import { cn } from 'ui'

const maxWidthClasses = 'mx-auto w-full max-w-[1600px]'
const paddingClasses = 'px-6 lg:px-14 xl:px-28 2xl:px-32'

const maxWidthClassesColumn = 'min-w-[420px]'

// lg: pt - 8

const ScaffoldHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <header {...props} ref={ref} className={cn('w-full', 'flex-col gap-3', className)}></header>
    )
  }
)

const ScaffoldTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return <h1 ref={ref} {...props} className={cn('text-3xl pt-6 pb-4', className)} />
})

const ScaffoldContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn(maxWidthClasses, paddingClasses, className)} />
  }
)

const ScaffoldDivider = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn('w-full h-px bg-scale-400', className)} />
  }
)

const ScaffoldSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn('flex flex-col gap-3 py-6', 'lg:grid md:grid-cols-12 lg:py-12', className)}
      />
    )
  }
)

const ScaffoldColumn = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn('flex flex-col gap-3', maxWidthClassesColumn, className)}
      />
    )
  }
)

const ScaffoldSectionDetail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, title, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className={cn('col-span-4 xl:col-span-5 prose text-sm', className)}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  )
})

const ScaffoldSectionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn('col-span-8 xl:col-span-7', 'flex flex-col gap-6', className)}
    />
  )
})

// Table and filters
const ScaffoldFilterAndContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} {...props} className={cn('flex flex-col gap-3 items-center', className)} />
})

// Actions Group
const ScaffoldActionsContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} {...props} className={cn('flex w-full items-center', className)} />
})

// Actions Group
const ScaffoldActionsGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} className={cn('flex flex-row gap-3', className)} />
  }
)

// For older layouts
const ScaffoldContainerLegacy = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(maxWidthClasses, paddingClasses, 'my-8 flex flex-col gap-8', className)}
    />
  )
})

ScaffoldHeader.displayName = 'ScaffoldHeader'
ScaffoldTitle.displayName = 'ScaffoldTitle'
ScaffoldContainer.displayName = 'ScaffoldContainer'
ScaffoldDivider.displayName = 'ScaffoldDivider'
ScaffoldSection.displayName = 'ScaffoldSection'
ScaffoldColumn.displayName = 'ScaffoldColumn'
ScaffoldSectionDetail.displayName = 'ScaffoldSectionDetail'
ScaffoldSectionContent.displayName = 'ScaffoldSectionContent'
ScaffoldFilterAndContent.displayName = 'ScaffoldFilterAndContent'
ScaffoldActionsContainer.displayName = 'ScaffoldActionsContainer'
ScaffoldActionsGroup.displayName = 'ScaffoldActionsGroup'
ScaffoldContainerLegacy.displayName = 'ScaffoldContainerLegacy'

export {
  ScaffoldHeader,
  ScaffoldTitle,
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldColumn,
  ScaffoldSectionDetail,
  ScaffoldSectionContent,
  ScaffoldFilterAndContent,
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
}
