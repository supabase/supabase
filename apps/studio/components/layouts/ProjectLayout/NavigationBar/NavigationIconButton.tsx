import { Button, cn } from 'ui'
import React, { forwardRef } from 'react'

const NavigationIconButton = forwardRef<
  HTMLButtonElement,
  Omit<
    React.ComponentProps<typeof Button>,
    // omit other icon props to avoid confusion
    // using `icon` instead as there is only 1 use case for this component
    'iconRight' | 'iconLeft'
  > & {
    rightText?: React.ReactNode
  }
>(({ icon, rightText, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      type="text"
      size="tiny"
      {...props}
      className={cn(
        'h-10 [&>span]:relative [&>span]:items-center [&>span]:gap-3 [&>span]:flex [&>span]:w-full [&>span]:h-full p-0',
        props.className
      )}
    >
      <div className="absolute left-2 text-foreground-lighter">{icon}</div>
      <span
        className=" 
        absolute
        left-7
        group-data-[state=expanded]:left-10
        w-[10rem]
        flex flex-col 
        items-center
        text-sm 
        opacity-0
        group-data-[state=expanded]:opacity-100 
        transition-all 
        delay-100              
    "
      >
        <span className="w-full text-left text-foreground-light truncate">{props.children}</span>
      </span>
      {rightText && (
        <div
          className={cn(
            'absolute',
            'items-center',
            'flex',
            'right-2',
            'opacity-0',
            'group-data-[state=expanded]:opacity-100 ',
            'transition-all '
          )}
        >
          {rightText}
        </div>
      )}
    </Button>
  )
})

NavigationIconButton.displayName = 'NavigationIconButton'

export { NavigationIconButton }
