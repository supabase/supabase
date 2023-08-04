import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import { CH } from '@code-hike/mdx/components'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'
import Chart from '~/components/Charts/PGCharts'
import InlineCodeTag from '~/components/InlineCode'
import { Badge } from 'ui'
import ImageFadeStack from '~/components/ImageFadeStack'

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

export default function mdxComponents(type?: 'blog' | 'lp' | undefined) {
  const components = {
    CodeBlock,
    CH,
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
              className={[type === 'blog' ? 'rounded-md border' : ''].join(' ')}
              layout="fill"
            />
          </span>
        )
      }
      return <img {...props} />
    },
    Img: (props: any) => (
      <figure>
        <span className={['next-image--dynamic-fill', props.wide && 'wide'].join(' ')}>
          <Image
            {...props}
            className={[type === 'blog' ? 'rounded-md border' : ''].join(' ')}
            layout="fill"
          />
        </span>
        {props.caption && (
          <figcaption className={[getCaptionAlign(props.captionAlign)].join(' ')}>
            {props.caption}
          </figcaption>
        )}
      </figure>
    ),
    Link: (props: HTMLAnchorElement) => (
      <a href={props.href} target={props.target}>
        {props.children}
      </a>
    ),
    code: (props: any) => <InlineCodeTag>{props.children}</InlineCodeTag>,
  }

  return components
}
