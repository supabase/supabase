import React from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  title: string
  image: any
}

const CenteredTitleImage = ({ title, image: Image }: Props) => {
  return (
    <SectionContainer>
      <div className="flex flex-col items-center text-center gap-8">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
        <div className="w-full max-w-6xl aspect-[2/1] md:aspect-[3/1] flex justify-center items-center mx-auto">
          <Image />
        </div>
      </div>
    </SectionContainer>
  )
}

export default CenteredTitleImage
