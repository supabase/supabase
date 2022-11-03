export const getAnchor = (text: any): string | undefined => {
  let formattedText
  if (typeof text === 'object') {
    if (Array.isArray(text)) {
      formattedText = text.map((x) => {
        if (typeof x !== 'string') {
          return x.props.children
        } else {
          return x.trim()
        }
      })
      return formattedText.join('-').toLowerCase()
    } else {
      return text.props.children
    }
  } else if (typeof text === 'string') {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9- ]/g, '')
      .replace(/[ ]/g, '-')
  } else {
    return undefined
  }
}

export const removeAnchor = (text: any) => {
  if (typeof text !== 'string') {
    return text
  } else {
    if (text.indexOf('{#') > 0) return text.slice(0, text.indexOf('{#'))
    else return text
  }
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
