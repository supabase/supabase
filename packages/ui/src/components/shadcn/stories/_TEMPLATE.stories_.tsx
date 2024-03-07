import { Meta } from '@storybook/react'
import { Card } from '../ui/card'

const meta: Meta = {
  title: 'shadcn/Card',
  component: Card,
}

export const Default = () => {
  return (
    <div>
      <div></div>
    </div>
  )
}

export const CardWithForm = () => {
  return (
    <div>
      <div></div>
    </div>
  )
}

CardWithForm.storyName = 'Card with form custom name'

export default meta
