import 'react-medium-image-zoom/dist/styles.css'

import { PropsWithChildren } from 'react'
import Image from 'next/image'
import { ThemeImage } from 'ui-patterns/ThemeImage'

import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { CH } from '@code-hike/mdx/components'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'
import Chart from '~/components/Charts/PGCharts'
import InlineCodeTag from '~/components/InlineCode'
import {
  Admonition,
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  CollapsibleContent_Shadcn_,
  Heading,
  IconArrowUpRight,
  IconTriangle,
} from 'ui'
import ImageFadeStack from '~/components/ImageFadeStack'
import ZoomableImg from '~/components/ZoomableImg/ZoomableImg'

// import all components used in blog articles here
// to do: move this into a helper/utils, it is used elsewhere

const ignoreClass = 'ignore-on-export'

const getCaptionAlign = (align?: 'left' | 'center' | 'right') => {
  switch (align) {
    case 'left':
      return 'text-left'
    case 'right':
      return 'text-right'
    case 'center':
    default:
      return 'text-center'
  }
}

const LinkComponent = (props: PropsWithChildren<HTMLAnchorElement>) => (
  <a
    href={props.href}
    target={props.target}
    className={cn('inline relative [&_p]:inline', props.target === '_blank' && 'mr-4')}
  >
    {props.children}{' '}
    {props.target === '_blank' && <IconArrowUpRight className="absolute -right-3.5 w-3 top-0" />}
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
        <IconTriangle size={10} />
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
          <span className={['next-image--dynamic-fill'].join(' ')}>
            <Image
              {...props}
              className={[type === 'blog' ? 'm-0 object-cover rounded-md border' : ''].join(' ')}
              fill
              loading="lazy"
            />
          </span>
        )
      }
      return <img {...props} />
    },
    Img: ({ zoomable = true, className, ...props }: any) => (
      <figure className={cn('m-0', className)}>
        <ZoomableImg zoomable={zoomable}>
          <span
            className={[
              'next-image--dynamic-fill',
              type === 'blog' ? 'rounded-md border' : '',
              props.wide && 'wide',
            ].join(' ')}
          >
            <ThemeImage fill className="m-0 object-cover" {...props} />
          </span>
        </ZoomableImg>
        {props.caption && (
          <figcaption className={[getCaptionAlign(props.captionAlign)].join(' ')}>
            {props.caption}
          </figcaption>
        )}
      </figure>
    ),
    Link: LinkComponent,
    code: (props: any) => <InlineCodeTag>{props.children}</InlineCodeTag>,
    BlogCollapsible: (props: any) => <BlogCollapsible {...props} />,
    Admonition,
  }

  return components as any
}
