import Link from 'next/link'
import React, { FC } from 'react'
import { cn } from 'ui'

import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  quote: Quote
  className?: string
  authorClassName?: string
  roleClassName?: string
  avatarClassName?: string
  logoClassName?: string
}

type Quote = {
  text: string
  author: string
  logo?: string | JSX.Element
  role: string
  avatar?: string | JSX.Element
  link?: string
}

const SingleQuote: FC<Props> = ({
  id: sectionId,
  quote,
  className,
  authorClassName,
  roleClassName,
  avatarClassName,
  logoClassName,
}) => {
  const MaybeLink = ({ children, href }: { children: React.ReactNode; href?: string }) => {
    if (href) {
      return (
        <Link className="hover:opacity-90 transition-opacity" href={href}>
          {children}
        </Link>
      )
    }
    return children
  }

  return (
    <SectionContainer
      id={sectionId}
      className={cn('flex flex-col items-center text-center gap-8 md:gap-16', className)}
    >
      <q className="text-2xl max-w-xs md:text-2xl xl:text-4xl md:!max-w-screen-lg w-full">
        {quote.text}
      </q>
      <MaybeLink href={quote.link}>
        <div className="flex flex-col items-center gap-10 group w-full">
          <div className="flex flex-col gap-6 items-center">
            {quote.avatar && (
              <figure
                className={cn(
                  'text-foreground-muted rounded-full overflow-hidden relative size-12 ',
                  avatarClassName
                )}
              >
                {quote.avatar}
              </figure>
            )}

            <div className="flex flex-col items-center gap-y-1">
              <span className={cn('text-foreground', authorClassName)}>{quote.author}</span>
              <span className={cn('text-foreground-lighter font-mono text-sm', roleClassName)}>
                {quote.role}
              </span>
            </div>
          </div>

          {quote.logo && (
            <figure
              className={cn('mb-4 max-w-24 md:max-w-32 text-foreground-lighter', logoClassName)}
            >
              {quote.logo}
            </figure>
          )}
        </div>
      </MaybeLink>
    </SectionContainer>
  )
}

export default SingleQuote
