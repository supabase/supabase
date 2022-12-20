import {
  getAnchor,
  removeAnchor,
  highlightSelectedTocItem,
  unHighlightSelectedTocItems,
} from './CustomHTMLElements.utils'
import { useInView } from 'react-intersection-observer'

/**
 * [Joshen] The trick with rootMargin
 * We are shrinking the top of the root element by 20 percent, which is currently our entire page,
 * and the bottom by 35 percent. Therefore, when a header is at the top 20 percent and bottom 35 percent
 * of our page, it will not be counted as visible.
 */

interface Props {
  tag: string
}

const Heading: React.FC<Props> = ({ tag, children }) => {
  const HeadingTag = `${tag}` as any
  const anchor = getAnchor(children)
  const link = `#${anchor}`

  const { ref } = useInView({
    threshold: 1,
    rootMargin: '-20% 0% -35% 0px',
    onChange: (inView, entry) => {
      if (window.scrollY === 0) unHighlightSelectedTocItems()
      if (inView) highlightSelectedTocItem(entry.target.id)
    },
  })

  return (
    <HeadingTag id={anchor} ref={ref} className="group scroll-mt-24">
      {removeAnchor(children)}
      {anchor && (
        <a href={link} className="ml-2 opacity-0 group-hover:opacity-100 transition">
          #
        </a>
      )}
    </HeadingTag>
  )
}
export default Heading
