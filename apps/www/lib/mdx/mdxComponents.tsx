import Image from 'next/image'
import Avatar from '~/components/Avatar'
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import ImageGrid from '~/components/ImageGrid'
import Quote from '~/components/Quote'

// import all components used in blog articles here
// to do: move this into a helper/utils, it is used elsewhere

const ignoreClass = 'ignore-on-export'

export default {
  CodeBlock,
  Quote,
  Avatar,
  code: (props: any) => {
    if (props.className !== ignoreClass) {
      return <CodeBlock {...props} />
    } else {
      return <code {...props} />
    }
  },
  ImageGrid,
  img: (props: any) => {
    if (props.className !== ignoreClass) {
      return (
        <div
          className="
            next-image--dynamic-fill 
            to-scale-400  
            from-scale-500 rounded-lg
            border bg-gradient-to-r
        "
        >
          <Image {...props} className="next-image--dynamic-fill rounded-md border" layout="fill" />
        </div>
      )
    }
    return <img {...props} />
  },
}
