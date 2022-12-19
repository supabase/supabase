import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'
import Chart from '~/components/Charts/PGCharts'
import InlineCodeTag from '~/components/InlineCode'
import { Badge } from 'ui'

// import all components used in blog articles here
// to do: move this into a helper/utils, it is used elsewhere

const ignoreClass = 'ignore-on-export'

export default function mdxComponents(type?: 'blog' | 'lp' | undefined) {
  const components = {
    CodeBlock,
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
    code: (props: any) => <InlineCodeTag>{props.children}</InlineCodeTag>,
  }

  return components
}
