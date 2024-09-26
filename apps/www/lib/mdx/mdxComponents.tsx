import { PropsWithChildren } from 'react'

import { CH } from '@code-hike/mdx/components'
import { ArrowUpRight, Triangle } from 'lucide-react'
import {
  Admonition,
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Heading,
  Image,
} from 'ui'
import { type ImageProps } from 'ui/src/components/Image/Image'
import Avatar from '~/components/Avatar'
import Chart from '~/components/Charts/PGCharts'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageFadeStack from '~/components/ImageFadeStack'
import ImageGrid from '~/components/ImageGrid'
import InlineCodeTag from '~/components/InlineCode'
import Quote from '~/components/Quote'

// import all components used in blog articles here
// to do: move this into a helper/utils, it is used elsewhere

const ignoreClass = 'ignore-on-export'

const LinkComponent = (props: PropsWithChildren<HTMLAnchorElement>) => (
  <a
    href={props.href}
    target={props.target}
    className={cn('inline relative [&_p]:inline', props.target === '_blank' && 'mr-4')}
  >
    {props.children}{' '}
    {props.target === '_blank' && <ArrowUpRight className="absolute -right-3.5 w-3 top-0" />}
  </a>
)

const BlogCollapsible = ({ title, ...props }: { title: string }) => {
  return (
    <Collapsible_Shadcn_>
      <CollapsibleTrigger_Shadcn_
        className="
        data-[state=open]:text
        hover:text-foreground-light
        flex items-center gap-3
        [&>svg]:fill-current
        [&>svg]:rotate-90
        [&>svg]:transition-transform
        [&>svg]:data-[state='open']:rotate-180
        [&>svg]:data-[state='open']:text
        "
      >
        <Triangle size={10} />
        <span>{title}</span>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_ {...props} />
    </Collapsible_Shadcn_>
  )
}

export default function mdxComponents(type?: 'blog' | 'lp' | undefined) {
  const components = {
    CodeBlock,
    CH,
    h1: (props: any) => <Heading {...props} tag="h1" />,
    h2: (props: any) => <Heading {...props} tag="h2" />,
    h3: (props: any) => <Heading {...props} tag="h3" />,
    h4: (props: any) => <Heading {...props} tag="h4" />,
    h5: (props: any) => <Heading {...props} tag="h5" />,
    h6: (props: any) => <Heading {...props} tag="h6" />,
    Badge,
    Quote,
    Avatar,
    PGChart: (props: any) => {
      return <Chart {...props} />
    },
    pre: (props: any) => {
      if (props.className !== ignoreClass) {
        return <CodeBlock {...props.children.props} />
      } else {
        return <code {...props} />
      }
    },
    ImageGrid,
    ImageFadeStack,
    img: (props: any) => {
      if (props.className !== ignoreClass) {
        return (
          <Image
            fill
            className={cn(
              'm-0 object-cover',
              type === 'blog' ? 'rounded-md border' : '',
              props.wide && 'wide',
              props.className
            )}
            {...props}
          />
        )
      }
      return <img {...props} />
    },
    Img: ({ zoomable = true, className, ...props }: ImageProps & { wide?: boolean }) => (
      <Image
        fill
        className={cn(
          'm-0 object-cover',
          type === 'blog' ? 'rounded-md border' : '',
          props.wide && 'wide',
          className
        )}
        zoomable={zoomable}
        {...props}
      />
    ),
    Link: LinkComponent,
    code: (props: any) => <InlineCodeTag>{props.children}</InlineCodeTag>,
    BlogCollapsible: (props: any) => <BlogCollapsible {...props} />,
    Admonition,
  }

  return components as any
}
