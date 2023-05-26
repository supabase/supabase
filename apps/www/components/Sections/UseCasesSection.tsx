import React, { ReactNode } from 'react'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface UseCase {
  img: string
  title: string
  description: string
}

interface Props {
  title: string | ReactNode
  paragraph: string | ReactNode
  useCases: UseCase[]
}

const UseCasesSection = ({ title, paragraph, useCases }: Props) => {
  return (
    <SectionContainer className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 items-center justify-center">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl font-medium">{title}</h2>
        <p className="p mx-auto text-center lg:w-1/2">{paragraph}</p>
      </div>
      <div className="grid gap-10 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {useCases.map((example) => {
          return (
            <>
              <div className="flex flex-col gap-3">
                <img
                  className="bg-scale-300 hidden rounded-lg dark:block"
                  src={`/images/realtime/example-apps/dark/${example.img}?type=1`}
                  alt={example.title}
                />
                <img
                  className="bg-scale-300 block rounded-lg dark:hidden"
                  src={`/images/realtime/example-apps/light/${example.img}`}
                  alt={example.title}
                />
                <div className="prose">
                  <h4 className="">{example.title}</h4>
                  <p className="text-sm">{example.description}</p>
                </div>
              </div>
            </>
          )
        })}
      </div>
    </SectionContainer>
  )
}

export default UseCasesSection
