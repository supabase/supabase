import type { QuoteBlock as QuoteBlockProps } from 'src/payload-types'

import React from 'react'

type Props = {
  className?: string
} & QuoteBlockProps

export const QuoteBlock: React.FC<Props> = ({ className, img, caption, text }) => {
  return `<Quote img={${img}} caption={${caption ?? ''}} className={${className}}>

{${text}}

</Quote>
`
}
