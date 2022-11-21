// Check if heading has custom anchor first, before forming the anchor based on the title
export const getAnchor = (text: any): string | undefined => {
  console.log({ text })
  if (typeof text === 'object') {
    console.log('is object')
    if (Array.isArray(text)) {
      console.log('is array')
      const customAnchor = text.find((x) => typeof x === 'string' && x.startsWith('#'))
      if (customAnchor !== undefined) return customAnchor.slice(1)

      const formattedText = text
        .map((x) => {
          if (typeof x !== 'string') return x.props.children
          else return x.trim()
        })
        .map((x) => {
          if (typeof x !== 'string') return x
          else
            return x
              .toLowerCase()
              .replace(/[^a-z0-9- ]/g, '')
              .replace(/[ ]/g, '-')
        })

      return formattedText.join('-').toLowerCase()
    } else {
      const anchor = text.props.children
      if (typeof anchor === 'string') {
        return anchor
          .toLowerCase()
          .replace(/[^a-z0-9- ]/g, '')
          .replace(/[ ]/g, '-')
      }
      return anchor
    }
  } else if (typeof text === 'string') {
    if (text.startsWith('#')) {
      return text.slice(1)
    } else {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9- ]/g, '')
        .replace(/[ ]/g, '-')
    }
  } else {
    return undefined
  }
}

export const removeAnchor = (text: any) => {
  if (typeof text === 'object' && Array.isArray(text)) {
    return text.filter((x) => !(typeof x === 'string' && x.startsWith('#')))
  } else if (typeof text === 'string') {
    if (text.startsWith('#')) return text.slice(1)
    else return text
  }
  return text
}

export const highlightSelectedTocItem = (id: string) => {
  const tocMenuItems = document.querySelectorAll('.toc-menu a')

  // find any currently active items and remove them
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

// find any currently active items and remove them on route change
export const unHighlightSelectedTocItems = () => {
  const currentActiveItem = document.querySelector('.toc-menu .toc__menu-item--active')
  currentActiveItem?.classList.remove('toc__menu-item--active')
}
