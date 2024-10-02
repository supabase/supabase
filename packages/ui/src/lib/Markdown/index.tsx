'use client'

import { CodeBlock } from '../../components/CodeBlock/CodeBlock'
import Image from 'next/image'
import { cn } from '../utils'

const NextImageHandler = (props: CSSProperties) => {
  return (
    <span className={cn('next-image--dynamic-fill', props.className)}>
      <Image {...props} className={['rounded-md border'].join(' ')} layout="fill" />
    </span>
  )
}

export const markdownComponents = {
  mono: (props: CSSProperties) => <code className="text-sm">{props.children}</code>,
  code: (props: CSSProperties) => <CodeBlock {...props} />,
  img: (props: CSSProperties) => NextImageHandler(props),
  Image: (props: CSSProperties) => NextImageHandler(props),
}
