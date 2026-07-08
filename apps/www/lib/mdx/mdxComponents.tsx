import {
  Annotation,
  annotations,
  Code,
  CodeSlot,
  InlineCode,
  Preview,
  PreviewSlot,
  Scrollycoding,
  Section,
  SectionCode,
  SectionLink,
  Slideshow,
  Spotlight,
} from '@code-hike/mdx/components'
import Avatar from '~/components/Avatar'
import BlogCollapsible from '~/components/Blog/BlogCollapsible'
import DeveloperGrowthChart from '~/components/Charts/DeveloperGrowthChart'
import Chart from '~/components/Charts/PGCharts'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { NamedCodeBlock } from '~/components/CodeTabs'
import ImageFadeStack from '~/components/ImageFadeStack'
import ImageGrid from '~/components/ImageGrid'
import InlineCodeTag from '~/components/InlineCode'
import Quote from '~/components/Quote'
import Tabs, { TabPanel } from '~/components/Tabs/Tabs'
import { ArrowUpRight } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Badge, cn, Heading } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Image, type ImageProps } from 'ui-patterns/Image'
import { Mermaid } from 'ui-patterns/Mermaid'

const CH = {
  Annotation,
  Code,
  CodeSlot,
  InlineCode,
  Preview,
  PreviewSlot,
  Scrollycoding,
  Section,
  SectionCode,
  SectionLink,
  Slideshow,
  Spotlight,
  annotations,
}

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

export default function mdxComponents(type?: 'blog' | 'lp' | undefined) {
  const components = {
    CodeBlock,
    Tabs,
    TabPanel,
    NamedCodeBlock,
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
    DeveloperGrowthChart,
    pre: (props: any) => {
      if (props.className !== ignoreClass) {
        const childProps = props.children?.props
        // Detect mermaid code blocks and render with Mermaid component
        if (childProps?.className === 'language-mermaid') {
          return <Mermaid chart={childProps.children} />
        }
        return <CodeBlock {...childProps} />
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
      // biome-ignore lint/a11y/useAltText: provided in props
      return <img {...props} />
    },
    Img: ({ zoomable = true, className, ...props }: ImageProps & { wide?: boolean }) => (
      <Image
        fill
        containerClassName={cn(props.wide && 'wide')}
        className={cn('m-0 object-cover', type === 'blog' ? 'rounded-md border' : '', className)}
        zoomable={zoomable}
        {...props}
      />
    ),
    Link: LinkComponent,
    code: (props: any) => <InlineCodeTag>{props.children}</InlineCodeTag>,
    BlogCollapsible: (props: any) => <BlogCollapsible {...props} />,
    Subtitle: (props: any) => (
      <p className={cn('-mt-6 text-foreground-lighter text-lg', props.className)} {...props} />
    ),
    Admonition,
    Mermaid,
  }

  return components as any
}
