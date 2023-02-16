import React, { ReactNode } from 'react'
import { useFlag } from '~/hooks/useFlag'

interface Props {
  children: ReactNode
  name: string
}

function Flag({ children, name }: Props) {
  const flagValue = useFlag(name)
  if (!flagValue) {
    return null
  }
  return <>{children}</>
}

export default Flag
