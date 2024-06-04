import React from 'react'
import Panel from '~/components/Panel'
import { Badge, Button, ButtonProps, IconCheck } from 'ui'
import Link from 'next/link'
import { ThemeImage } from 'ui-patterns'

export interface CardProps {
  title: string
  features?: string[]
  badge?: string
  ctas: {
    label: string
    href: string
    target: HTMLAnchorElement['target']
    type: ButtonProps['type']
  }[]
  image?: {
    dark: string
    light: string
  }
}

const NewFeatureCard = (props: CardProps) => (
  <Panel outerClassName="w-full" innerClassName="relative">
    <div className="relative z-10 flex flex-col gap-4 p-4 md:p-8 h-full">
      <div className="flex items-center gap-2">
        <h4 className="text-lg text-foreground">{props.title}</h4>
        {props.badge && (
          <Badge className="border-strong !bg-alternative-200 text-foreground">{props.badge}</Badge>
        )}
      </div>
      <div className="flex flex-col w-full xl:w-2/3 flex-grow mb-4 sm:mb-10 lg:mb-8 2xl:xl:mb-32">
        <ul className="flex flex-col text-foreground-lighter text-sm gap-1">
          {props.features?.map((feature: any) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="w-3 mt-0.5 flex items-center">
                <IconCheck className="stroke-2" />
              </span>{' '}
              <p>{feature}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center flex-wrap gap-1">
        {props.ctas.map((cta: any) => (
          <Button type={cta.type} asChild>
            <Link href={cta.href} target={cta.target}>
              {cta.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
    {props.image && (
      <div className="hidden sm:flex lg:hidden xl:flex absolute object-bottom inset-0 left-auto items-center h-full aspect-[296/275]">
        <ThemeImage
          src={props.image}
          alt={`database ${props.title}`}
          width="296"
          height="275"
          className=""
        />
      </div>
    )}
  </Panel>
)

export default NewFeatureCard
