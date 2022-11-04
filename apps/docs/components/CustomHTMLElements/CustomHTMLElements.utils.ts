// Check if heading has custom anchor first, before forming the anchor based on the title
export const getAnchor = (text: any): string | undefined => {
  if (typeof text === 'object') {
    if (Array.isArray(text)) {
      const customAnchor = text.find(
        (x) => typeof x === 'string' && x.includes('{#') && x.endsWith('}')
      )
      if (customAnchor !== undefined) return customAnchor.slice(3, customAnchor.indexOf('}'))

      const formattedText = text.map((x) => {
        if (typeof x !== 'string') return x.props.children
        else return x.trim()
      })
      return formattedText.join('-').toLowerCase()
    } else {
      return text.props.children
    }
  } else if (typeof text === 'string') {
    if (text.includes('{#') && text.endsWith('}')) {
      return text.slice(text.indexOf('{#') + 2, text.indexOf('}'))
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
    return text.filter((x) => !(typeof x === 'string' && x.includes('{#') && x.endsWith('}')))
  } else if (typeof text === 'string') {
    if (text.indexOf('{#') > 0) return text.slice(0, text.indexOf('{#'))
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
