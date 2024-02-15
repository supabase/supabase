import { PropsWithChildren } from 'react'
import Image from 'next/image'
import CopyToClipboard from 'react-copy-to-clipboard'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { CH } from '@code-hike/mdx/components'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'
import Chart from '~/components/Charts/PGCharts'
import InlineCodeTag from '~/components/InlineCode'
import {
  Badge,
  Collapsible_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  CollapsibleContent_Shadcn_,
  IconTriangle,
  cn,
  ThemeImage,
  Admonition,
  IconLink,
  IconCheck,
} from 'ui'
import ImageFadeStack from '~/components/ImageFadeStack'
import ZoomableImg from '~/components/ZoomableImg/ZoomableImg'

import 'react-medium-image-zoom/dist/styles.css'
import { useRouter } from 'next/router'
import { isBrowser, useCopy } from 'common'
import Link from 'next/link'

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

const Heading = (props: any) => {
  const Tag = props.as
  const { copied, handleCopy } = useCopy()
  const { query } = useRouter()
  const anchor = `${isBrowser ? window?.location.origin : 'https://supabase.com'}/blog/${query.slug}#${props.id}`

  return (
    <CopyToClipboard text={anchor ?? ''} onCopy={handleCopy}>
      <span className="relative group">
        <Tag {...props} className={cn('hover:cursor-pointer', props.className)}>
          {props.children}
          {copied ? (
            <IconCheck className="inline stroke-2 text-foreground-light ml-2 transition-all opacity-0 animate-fade-in" />
          ) : (
            <IconLink className="inline stroke-2 text-foreground-lighter ml-2 opacity-0 group-hover:opacity-100" />
          )}
        </Tag>
      </span>
    </CopyToClipboard>
  )
}

export default function mdxComponents(type?: 'blog' | 'lp' | undefined) {
  const components = {
    CodeBlock,
    CH,
    h1: (props: any) => <Heading {...props} as="h1" />,
    h2: (props: any) => <Heading {...props} as="h2" />,
    h3: (props: any) => <Heading {...props} as="h3" />,
    h4: (props: any) => <Heading {...props} as="h4" />,
    h5: (props: any) => <Heading {...props} as="h5" />,
    h6: (props: any) => <Heading {...props} as="h6" />,
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
    Link: (props: PropsWithChildren<HTMLAnchorElement>) => (
      <a href={props.href} target={props.target}>
        {props.children}
      </a>
    ),
    code: (props: any) => <InlineCodeTag>{props.children}</InlineCodeTag>,
    BlogCollapsible: (props: any) => <BlogCollapsible {...props} />,
    Admonition,
  }

  return components as any
}
