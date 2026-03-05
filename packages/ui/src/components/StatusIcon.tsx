import { Check } from 'lucide-react'
import { forwardRef, SVGProps } from 'react'

import { cn } from '../lib/utils'

export interface StatusIconProps {
  hideBackground?: boolean
}

export const StatusIcon = forwardRef<
  HTMLOrSVGElement,
  React.ComponentPropsWithoutRef<'svg'> & {
    variant: 'success' | 'warning' | 'destructive' | 'default'
  } & StatusIconProps
>(({ variant = 'default', ...props }, ref) => {
  let Icon: React.ElementType | undefined
  if (variant === 'warning') {
    Icon = WarningIcon
  } else if (variant === 'destructive') {
    Icon = CriticalIcon
  } else if (variant === 'success') {
    Icon = CheckIcon
  } else {
    Icon = InfoIcon
  }

  return Icon ? <Icon ref={ref} {...props} /> : null
})

const InfoIcon: React.FC<SVGProps<SVGSVGElement> & StatusIconProps> = ({
  hideBackground = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      className={cn(
        !hideBackground
          ? 'w-4 h-4 p-0.5 bg-foreground-lighter text-background-surface-200 rounded'
          : 'w-3 h-3 text-foreground-lighter',
        props.className
      )}
    >
      <path
        fillRule="evenodd"
        d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const CriticalIcon: React.FC<SVGProps<SVGSVGElement> & StatusIconProps> = ({
  hideBackground = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      className={cn(
        !hideBackground
          ? 'w-4 h-4 p-0.5 bg-destructive-600 text-destructive-200 rounded'
          : 'w-3 h-3 text-destructive-600',
        props.className
      )}
    >
      <path
        fillRule="evenodd"
        d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 1 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const WarningIcon: React.FC<SVGProps<SVGSVGElement> & StatusIconProps> = ({
  hideBackground = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      className={cn(
        !hideBackground
          ? 'w-4 h-4 p-0.5 bg-warning-600 text-warning-200 rounded'
          : 'w-3 h-3 text-warning',
        props.className
      )}
    >
      <path
        fillRule="evenodd"
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const CheckIcon: React.FC<SVGProps<SVGSVGElement> & StatusIconProps> = ({
  hideBackground = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      {...props}
      className={cn(
        !hideBackground
          ? 'w-4 h-4 p-0.5 bg-foreground text-background rounded'
          : 'w-3 h-3 text-success-600',
        props.className
      )}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  )
}

const EyeIcon: React.FC<SVGProps<SVGSVGElement> & StatusIconProps> = ({
  hideBackground = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={cn(
        !hideBackground
          ? 'w-4 h-4 p-0.5 bg-warning-600 text-warning-200 rounded'
          : 'w-3 h-3 text-warning',
        props.className
      )}
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const EyeOffIcon: React.FC<SVGProps<SVGSVGElement> & StatusIconProps> = ({
  hideBackground = false,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={cn(
        !hideBackground
          ? 'w-4 h-4 p-0.5 bg-foreground-light text-background rounded'
          : 'w-3 h-3 text-warning',
        props.className
      )}
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export { CriticalIcon, InfoIcon, WarningIcon, CheckIcon, EyeIcon, EyeOffIcon }
