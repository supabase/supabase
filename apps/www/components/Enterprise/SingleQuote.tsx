import Link from 'next/link'
import React, { FC } from 'react'
import { cn } from 'ui'

import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  quote: Quote
  className?: string
}

type Quote = {
  text: string
  author: string
  logo?: string | JSX.Element
  role: string
  avatar?: string | JSX.Element
  link?: string
}

const SingleQuote: FC<Props> = ({ id: sectionId, quote, className }) => {
  return (
    <SectionContainer
      id={sectionId}
      className={cn('flex flex-col items-center text-center gap-8 md:gap-12', className)}
    >
      <q className="text-2xl max-w-xs md:text-3xl md:max-w-xl">{quote.text}</q>
      <div className="flex flex-col items-center gap-1">
        {quote.logo && <figure className="text-foreground-lighter mb-4">{quote.logo}</figure>}
        <span className="text-foreground">{quote.author}</span>
        <span className="text-foreground-lighter font-mono text-sm">{quote.role}</span>
        {quote.avatar && (
          <Link href={quote.link ?? '#'}>
            <figure className="text-foreground-muted mt-4">{quote.avatar}</figure>
          </Link>
        )}
      </div>
    </SectionContainer>
  )
}

export default SingleQuote
