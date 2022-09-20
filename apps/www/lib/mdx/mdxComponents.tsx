import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'

// import all components used in blog articles here
// to do: move this into a helper/utils, it is used elsewhere

const ignoreClass = 'ignore-on-export'

export default function mdxComponents(type?: 'blog' | 'lp' | undefined) {
  const components = {
    CodeBlock,
    Quote,
    Avatar,
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
          <div
            className={[
              'next-image--dynamic-fill',
              type === 'blog' && 'to-scale-400 from-scale-500 rounded-lg border bg-gradient-to-r',
            ].join(' ')}
          >
            <Image
              {...props}
              className={['next-image--dynamic-fill', type === 'blog' && 'rounded-md border'].join(
                ' '
              )}
              layout="fill"
            />
          </div>
        )
      }
      return <img {...props} />
    },
  }

  return components
}
