import {
  getAnchor,
  removeAnchor,
  highlightSelectedTocItem,
  unHighlightSelectedTocItems,
} from './CustomHTMLElements.utils'
import { useInView } from 'react-intersection-observer'

const Heading = ({ tag, children }) => {
  const HeadingTag = `${tag}` as any
  const anchor = getAnchor(children)
  const link = `#${anchor}`

  // check if current heading is in view, update TOC active item accordingly
  // [Joshen] Ideally we highlight the section in the TOC when it's at the top of the page
  // much like when we click on the item in the TOC itself, the rootMargin fix is insufficient
  const { ref } = useInView({
    threshold: 1,
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
