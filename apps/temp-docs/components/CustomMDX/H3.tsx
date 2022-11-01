import { getAnchor, removeAnchor } from './CustomMDX.utils'

import { useInView } from 'react-intersection-observer'

// move this to a utils file if looks good
function highlightSelectedTocItem(id) {
  const tocMenuItems = document.querySelectorAll('.toc-menu a')

  // remove all active items first
  const currentActiveItem = document.querySelector('.toc-menu .toc__menu-item--active')
  currentActiveItem?.classList.remove('toc__menu-item--active')

  // Add active class to the current item
  tocMenuItems.forEach((item) => {
    // @ts-ignore
    if (item.href.split('#')[1] === id) {
      item.classList.add('toc__menu-item--active')
    }
  })
}

const H3 = ({ children }) => {
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
    onChange: (inView, entry) => {
      highlightSelectedTocItem(entry.target.id)
    },
  })

  // useEffect(() => {
  //   if (entry?.target) {
  //     //highlightSelectedTocItem(entry.target.id)
  //   }

  //   //console.log(entry?.target?.id)
  // }, [inView])

  const anchor = getAnchor(children)
  const link = `#${anchor}`

  return (
    <h3
      id={anchor}
      ref={ref}
      className={`group flex gap-1 items-center scroll-mt-24 ${inView ? 'visible' : 'not-visible'}`}
    >
      {removeAnchor(children)}
      {anchor && (
        <a href={link} className="opacity-0 group-hover:opacity-100 transition">
          #
        </a>
      )}
    </h3>
  )
}
export default H3
