import { CalendarIcon } from 'lucide-react'
import { ComponentProps } from 'react'
import { Button, cn, Popover, PopoverContent, PopoverTrigger } from 'ui'

export const DatePicker = (props: ComponentProps<typeof Popover>) => {
  return <Popover {...props} />
}

export const DatePickerTrigger = ({
  asChild = true,
  ...props
}: ComponentProps<typeof PopoverTrigger>) => {
  return <PopoverTrigger asChild={asChild} {...props} />
}

const DatePickerIcon = <CalendarIcon className="h-4 w-4" />

export type DatePickerButtonProps = ComponentProps<typeof Button> & { isInvalid?: boolean }

export const DatePickerButton = ({
  className,
  variant = 'default',
  icon = DatePickerIcon,
  isInvalid = false,
  ...props
}: DatePickerButtonProps) => {
  return (
    <Button
      variant={variant}
      className={cn(
        'justify-start text-left font-normal px-3 py-4',
        {
          'bg-destructive-200! border-destructive-400 focus:border-destructive focus-visible:border-destructive focus-visible:outline-amber-700':
            isInvalid,
        },
        className
      )}
      icon={icon}
      {...props}
    />
  )
}

export const DatePickerContent = ({
  className,
  align = 'start',
  ...props
}: ComponentProps<typeof PopoverContent>) => {
  return <PopoverContent className={cn('w-auto p-0', className)} align={align} {...props} />
}
