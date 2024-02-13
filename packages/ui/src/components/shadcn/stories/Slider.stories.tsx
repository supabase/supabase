import { Meta } from '@storybook/react'
import React from 'react'
import { cn } from '../../../lib/utils/cn'
import { Slider } from '../ui/slider'

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
