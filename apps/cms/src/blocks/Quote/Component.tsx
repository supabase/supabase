import React from 'react'

import type { QuoteBlock as QuoteBlockProps } from '@/payload-types'

type Props = {
  className?: string
} & QuoteBlockProps

export const QuoteBlock: React.FC<Props> = ({ className, img, caption, text }) => {
  return `<Quote img={${img}} caption={${caption ?? ''}} className={${className}}>

{${text}}

</Quote>
`
}
