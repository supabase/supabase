import * as React from 'react'
import { CodeBlock } from '../../components/CodeBlock/CodeBlock'
import Image from 'next/image'
import { cn } from '../utils'

const NextImageHandler = (props: any) => {
  return (
    <span className={cn('next-image--dynamic-fill', props.className)}>
      <Image {...props} className={['rounded-md border'].join(' ')} layout="fill" />
    </span>
  )
}

export const markdownComponents = {
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
  code: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => NextImageHandler(props),
  Image: (props: any) => NextImageHandler(props),
}
