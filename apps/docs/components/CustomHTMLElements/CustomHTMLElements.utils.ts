// Check if heading has custom anchor first, before forming the anchor based on the title
export const getAnchor = (text: any): string | undefined => {
  if (typeof text === 'object') {
    if (Array.isArray(text)) {
      const customAnchor = text
        .find((x) => typeof x === 'object' && x.props.children.startsWith('#'))
        .props.children.slice(1)

      return customAnchor
        .toLowerCase()
        .replace(/[^a-z0-9- ]/g, '')
        .replace(/[ ]/g, '-')
    } else {
      const anchor = text.props.children

      if (typeof anchor === 'string') {
        console.log('anywhere')
        return anchor
          .toLowerCase()
          .replace(/[^a-z0-9- ]/g, '')
          .replace(/[ ]/g, '-')
      }

      if (anchor.endsWith('{')) return anchor.slice(0, -1)

      return anchor
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
  if (typeof text === 'object' && Array.isArray(text)) {
    return text.filter((x) => {
      console.log('its an object first')
      if (x.props) {
        if (!x.props.children.startsWith('#')) {
          return x
        }
      } else {
        console.log('so what is this then', x)
        if (x.endsWith('}')) return
        if (x.endsWith('{')) {
          console.log('watttt', x)
          return x.slice(0, -1).trim()
        } else {
          console.log('huhhhhhhhh', x)
          return x
        }
      }
    })
  } else if (typeof text === 'string') {
    console.log('but then its a string')
    if (text.endsWith('{')) return text.slice(0, -1)
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
