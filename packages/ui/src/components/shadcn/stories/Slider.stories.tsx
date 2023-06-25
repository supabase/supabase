import { Meta } from '@storybook/react'
import { Slider } from '@ui/components/shadcn/ui/slider'
import { cn } from '@ui/lib/utils'

const meta: Meta = {
  title: 'shadcn/Slider',
  component: Slider,
}

type SliderProps = React.ComponentProps<typeof Slider>

export function SliderDemo({ className, ...props }: SliderProps) {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      className={cn('w-[60%]', className)}
      {...props}
    />
  )
}

export default meta
