import Link from 'next/link'
import React, { ReactNode } from 'react'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Button } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { pageData } from '~/data/products/vector/page'

interface Props {
  title: string | ReactNode
  paragraph: string
  features: {
    icon: string
    title: string
    text: string
  }[]
}

const FeaturesSection = ({ title, paragraph, features }: Props) => {
  return (
    <SectionContainer>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 justify-between">
        <div className="col-span-full lg:col-span-4 gap-2 flex flex-col">
          <h2 className="text-2xl sm:text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
            {title}
          </h2>
          <p className="text-scale-900 mb-4">{paragraph}</p>
          <Link href="">
            <a className="">
              <Button type="default" size="small">
                Explore documentation
              </Button>
            </a>
          </Link>
        </div>
        <div className="col-span-full lg:col-start-6 lg:col-span-7 space-y-10 lg:space-y-0 flex flex-col lg:grid lg:grid-cols-2 lg:gap-16">
          {features.map((feature: { icon: string; title: string; text: string }, i: number) => {
            return (
              <div className="h-full flex items-start space-x-3 w-full" key={i}>
                <div className="flex items-center">
                  <div className="relative w-full h-6 flex items-center mx-auto">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d={feature.icon}
                        stroke="var(--colors-scale12)"
                        strokeMiterlimit="10"
                        strokeLinejoin="bevel"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm lg:text-base">
                  <h2 className="text-base">{feature.title}</h2>
                  <ReactMarkdown className="prose pt-1 text-sm text-scale-900">
                    {feature.text}
                  </ReactMarkdown>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionContainer>
  )
}

export default FeaturesSection
