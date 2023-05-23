import { cn } from '../../../../lib/utils'
import { VariantProps, cva } from 'class-variance-authority'
import { AlertOctagon, AlertTriangle, Check, Info } from 'lucide-react'
import * as React from 'react'

export type AlertRootVariantsProps = VariantProps<typeof alertRootVariants>
const alertRootVariants = cva(
  `relative w-full 
  rounded-lg border 
  py-4 px-6
  [&>svg]:absolute [&>svg]:text-foreground [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11`,
  {
    variants: {
      variant: {
        danger: `bg-red-200 dark:bg-red-100 text-red-1200 border-red-700 [&>svg]:text-red-1200`,
        warning: `bg-amber-200 dark:bg-amber-100 border-amber-700 [&>svg]:text-amber-1200`,
        info: `bg-scale-400 border-scale-500 dark:bg-scale-100 dark:border-scale-300 [&>svg]:text-scale-1200`,
        success: `bg-brand-300 dark:bg-brand-100 border-brand-700 [&>svg]:text-brand-900`,
        neutral: `bg-scale-300 dark:bg-scale-300 border-scale-500 [&>svg]:text-scale-900`,
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

const alertTitleVariants = cva('mb-1 font-medium leading-none tracking-tight', {
  variants: {
    variant: {
      danger: `text-red-1200`,
      warning: `text-amber-1200`,
      info: `text-scale-1200`,
      success: `text-brand-1200`,
      neutral: `text-scale-1200`,
    },
    defaultVariants: {
      variant: 'info',
    },
  },
})

const alertDescriptionVariants = cva('text-sm [&_p]:leading-relaxed', {
  variants: {
    variant: {
      danger: 'text-red-1100',
      warning: 'text-amber-1100',
      info: 'text-scale-1100',
      success: 'text-brand-1100',
      neutral: 'text-scale-1100',
    },
    defaultVariants: {
      variant: 'info',
    },
  },
})

interface ContextValue {
  variant: AlertRootVariantsProps['variant']
}

const AlertContext = React.createContext<ContextValue>({
  variant: undefined,
})

// Define the Alert component
interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertRootVariants> {
  withIcon: boolean
}

interface AlertComponent
  extends React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>> {
  Title: typeof AlertTitle
  Description: typeof AlertDescription
}

type AlertIconVariant = Exclude<AlertRootVariantsProps['variant'], null | undefined>
const icons: Record<AlertIconVariant, React.ReactElement> = {
  danger: <AlertOctagon strokeWidth={1.5} size={18} />,
  success: <Check strokeWidth={1.5} size={18} />,
  warning: <AlertTriangle strokeWidth={1.5} size={18} />,
  info: <Info strokeWidth={1.5} size={18} />,
  neutral: <></>,
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, withIcon, variant = 'info', children, ...props }, ref) => {
    const contextValue = {
      variant,
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertRootVariants({ variant }), className)}
        {...props}
        children={
          <AlertContext.Provider value={{ ...contextValue }}>
            {withIcon && icons[variant as AlertIconVariant]}
            {children}
          </AlertContext.Provider>
        }
      />
    )
  }
) as AlertComponent

Alert.displayName = 'Alert'

// Define the AlertTitle component as a subcomponent of Alert
interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    const { variant } = React.useContext(AlertContext)
    console.log('variant', variant)
    return <h5 ref={ref} className={cn(alertTitleVariants({ variant }), className)} {...props} />
  }
)

AlertTitle.displayName = 'AlertTitle'

// Define the AlertDescription component as a subcomponent of Alert
interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { variant } = React.useContext(AlertContext)
    return (
      <div ref={ref} className={cn(alertDescriptionVariants({ variant }), className)} {...props} />
    )
  }
)

AlertDescription.displayName = 'AlertDescription'

// Attach the subcomponents to the Alert component
Alert.Title = AlertTitle
Alert.Description = AlertDescription

// Export the Alert component
export { Alert }
