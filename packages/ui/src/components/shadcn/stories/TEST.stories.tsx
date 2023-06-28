import { Meta } from '@storybook/react'
import { Card } from '@ui/components/shadcn/ui/card'
import { Mail } from 'lucide-react'

const meta: Meta = {
  title: 'shadcn/TEST',
  component: Card,
}

export const Default = () => {
  return (
    <div className="bg-overlay w-96 h-96 border border-overlay rounded-xl p-3">
      <div className="text">layer 1</div>
      <div className="shadow-sm bg-warning-400 bg-warning text-warning-300 w-96 h-96 border border-warning-300 rounded-xl p-3">
        <div className="bg-warning h-8 w-8 text-warning-400 rounded-lg flex items-center justify-center">
          <Mail size={16} />
        </div>
        <div className="bg-sputnik h-8 w-8 text-warning-400 rounded-lg flex items-center justify-center">
          <Mail size={16} />
        </div>
      </div>
    </div>
  )
}

export default meta
