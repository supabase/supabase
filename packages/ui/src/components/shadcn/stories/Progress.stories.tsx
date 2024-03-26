import { Meta } from '@storybook/react'
import * as React from 'react'
import { Progress } from '../ui/progress'

const meta: Meta = {
  title: 'shadcn/Progress',
  component: Progress,
}

export function Default() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress value={progress} className="w-[60%]" />
}

export default meta
