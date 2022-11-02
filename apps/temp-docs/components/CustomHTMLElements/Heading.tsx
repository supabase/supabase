import { getAnchor, removeAnchor, highlightSelectedTocItem } from './CustomHTMLElements.utils'
import { useInView } from 'react-intersection-observer'

const Heading = ({ tag, children }) => {
  const HeadingTag = `${tag}` as any

  const anchor = getAnchor(children)
  const link = `#${anchor}`

  // check if current heading is in view, update TOC active item accordingly
  const { ref, inView, entry } = useInView({
    threshold: 1,
    onChange: (inView, entry) => {
      if (inView) highlightSelectedTocItem(entry.target.id)
    },
  })

  return (
    <HeadingTag id={anchor} ref={ref} className="group flex gap-1 items-center scroll-mt-24">
      {removeAnchor(children)}
      {anchor && (
        <a href={link} className="opacity-0 group-hover:opacity-100 transition">
          #
        </a>
      )}
    </HeadingTag>
  )
}
export default Heading
