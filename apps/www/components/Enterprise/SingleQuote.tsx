import React, { FC } from 'react'

import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  quote: Quote
}

type Quote = {
  text: string
  author: string
  logo: string | JSX.Element
  role: string
}

const SingleQuote: FC<Props> = ({ id: sectionId, quote }) => {
  return (
    <SectionContainer
      id={sectionId}
      className="flex flex-col items-center text-center gap-8 md:gap-12"
    >
      <q className="text-2xl max-w-xs md:text-3xl md:max-w-xl">{quote.text}</q>
      <div className="flex flex-col items-center gap-1">
        <figure className="text-foreground-lighter mb-4">{quote.logo}</figure>
        <span className="text-foreground">{quote.author}</span>
        <span className="text-foreground-lighter">{quote.role}</span>
      </div>
    </SectionContainer>
  )
}

export default SingleQuote
