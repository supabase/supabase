import Link from 'next/link'
import React, { ReactNode } from 'react'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface UseCase {
  img: string
  title: string
  description: string
  cta?: {
    label?: string
    link: string
  }
}

interface Props {
  title: string | ReactNode
  paragraph: string | ReactNode
  useCases: UseCase[]
}

const UseCasesSection = ({ title, paragraph, useCases }: Props) => {
  return (
    <SectionContainer className="flex flex-col gap-12">
      <div className="flex flex-col text-center gap-4 items-center justify-center">
        <h2 className="heading-gradient text-2xl sm:text-3xl xl:text-4xl">{title}</h2>
        <p className="mx-auto text-scale-900 lg:w-1/2">{paragraph}</p>
      </div>
      <div className="grid gap-10 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {useCases.map((example) => {
          return (
            <>
              <div className="flex flex-col gap-3">
                <img
                  className="bg-scale-300 hidden w-full aspect-video rounded-lg dark:block"
                  src={`/images/realtime/example-apps/dark/${example.img}?type=1`}
                  alt={example.title}
                />
                <img
                  className="bg-scale-300 block rounded-lg dark:hidden"
                  src={`/images/realtime/example-apps/light/${example.img}`}
                  alt={example.title}
                />
                <div className="prose">
                  <h4 className="text-lg">{example.title}</h4>
                  <p className="text-sm text-scale-900">{example.description}</p>
                  {example.cta && (
                    <Link href={example.cta.link}>
                      <a>
                        <Button size="tiny" type="default">
                          {example.cta.label ?? 'View example'}
                        </Button>
                      </a>
                    </Link>
                  )}
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
