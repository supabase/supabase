import React, { ReactNode } from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  title: string
  image: string | ReactNode
}

const CenteredTitleImage = ({ title, image }: Props) => {
  return (
    <SectionContainer>
      <div className="flex flex-col items-center text-center gap-8">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
        <div className="w-full max-w-5xl aspect-[2/1] md:aspect-[3/1] flex justify-center items-center mx-auto">
          {image}
        </div>
      </div>
    </SectionContainer>
  )
}

export default CenteredTitleImage
