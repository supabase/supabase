import { forwardRef } from 'react'
import { cn } from 'ui'

const Grid = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t border-l my-12',
          props.className
        )}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'

const GridItem = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          `
            relative
            min-h-32 
            flex gap-4 flex-col items-center p-4
            border-b border-r
            bg-surface-75/50 
            justify-center hover:bg-surface-100
            group
            cursor-pointer
        `,
          props.className
        )}
      >
        <div
          className="
                    absolute
                    w-full h-full box-content
                    transition 
                    group-hover:border 
                    group-hover:border-foreground-muted 
                    group-data-[state=open]:border 
                    group-data-[state=open]:border-foreground-muted 
                "
        ></div>
        {children}
      </div>
    )
  }
)

GridItem.displayName = 'GridItem'

export { Grid, GridItem }
