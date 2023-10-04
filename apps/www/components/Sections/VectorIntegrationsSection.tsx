import React from 'react'
import { useTheme } from 'next-themes'
import { useBreakpoint } from 'common'

import SectionContainer from '~/components/Layouts/SectionContainer'
import Image from 'next/image'

interface Props {
  title: string
}

const VectorIntegrationsSection = ({ title }: Props) => {
  const { resolvedTheme } = useTheme()
  const isMobile = useBreakpoint(767)

  const image =
    resolvedTheme === 'dark'
      ? `/images/product/vector/vector-integrations-dark${isMobile ? '-mobile' : ''}.svg`
      : `/images/product/vector/vector-integrations-light${isMobile ? '-mobile' : ''}.svg`

  return (
    <SectionContainer>
      <div className="flex flex-col items-center text-center gap-8">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
        <div className="relative w-full max-w-6xl aspect-[2/1] md:aspect-[3/1] flex justify-center items-center mx-auto">
          <Image
            src={image}
            alt="Diagram of Machine Learning tools that integrate with Supabase Vector"
            layout="fill"
            objectFit="contain"
          />
        </div>
      </div>
    </SectionContainer>
  )
}

export default VectorIntegrationsSection
