import Link from 'next/link'
import React, { ReactNode } from 'react'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import InteractiveShimmerCard from '../InteractiveShimmerCard'

interface UseCase {
  img?: string
  title: string
  description: string
  icon?: string
  cta?: {
    label?: string
    link: string
    isDisabled?: boolean
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
      <div className="mx-auto w-full max-w-5xl grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {useCases.map((example) => {
          return (
            <InteractiveShimmerCard innerClassName="p-4 md:p-8 h-full !bg-scale-200">
              <div className="h-full flex flex-col gap-4 items-start justify-between">
                <div className="prose">
                  <div className="flex items-center gap-1">
                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d={example.icon} fill="var(--colors-scale11)" />
                    </svg>
                    <h4 className="text-sm md:text-lg m-0">{example.title}</h4>
                  </div>
                  <p className="text-sm text-scale-900 mt-2">{example.description}</p>
                </div>
                {example.cta &&
                  (example.cta.isDisabled ? (
                    <Button size="tiny" type="default" disabled className="justify-end">
                      {example.cta.label ?? 'View example'}
                    </Button>
                  ) : (
                    <Link href={example.cta.link}>
                      <a>
                        <Button size="tiny" type="default">
                          {example.cta.label ?? 'View example'}
                        </Button>
                      </a>
                    </Link>
                  ))}
              </div>
            </InteractiveShimmerCard>
          )
        })}
      </div>
    </SectionContainer>
  )
}

export default UseCasesSection
