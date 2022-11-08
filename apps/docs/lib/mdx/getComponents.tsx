import Image from 'next/image'
import LinkCard from '~/components/LinkCard'
import LinkCardsWrapper from '~/components/LinkCardsWrapper'

const ignoreClass = 'ignore-on-export'

function getComponents(type: any) {
  const components = {
    LinkCardsWrapper: (props: any) => <LinkCardsWrapper {...props} />,
    LinkCard: (props: any) => <LinkCard {...props} />,
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

export default getComponents
