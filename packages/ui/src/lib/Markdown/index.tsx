import * as React from 'react'
import { CodeBlock } from '../../components/CodeBlock/CodeBlock'
import Image from 'next/image'

export const markdownComponents = {
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
  code: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => {
    return (
      <span className={['next-image--dynamic-fill'].join(' ')}>
        <Image {...props} className={['rounded-md border'].join(' ')} layout="fill" />
      </span>
    )
  },
}
