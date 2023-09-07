// Check if heading has custom anchor first, before forming the anchor based on the title
export const getAnchor = (text: any): string | undefined => {
  if (typeof text === 'object') {
    if (Array.isArray(text)) {
      const customAnchor = text.find((x) => typeof x === 'string' && hasCustomAnchor(x))
      if (customAnchor !== undefined) {
        return parseCustomAnchor(customAnchor)
      }

      const formattedText = text
        .map((x) => {
          if (typeof x !== 'string') {
            return x.props.children
          }

          return x.trim()
        })
        .map((x) => {
          if (typeof x !== 'string') {
            return x
          }

          return slugify(x)
        })

      return formattedText.join('-').toLowerCase()
    } else {
      const anchor = text.props.children
      if (typeof anchor === 'string') {
        return slugify(anchor)
      }
      return anchor
    }
  } else if (typeof text === 'string') {
    if (hasCustomAnchor(text)) {
      return parseCustomAnchor(text)
    }
    return slugify(text)
  } else {
    return undefined
  }
}

const hasCustomAnchor = (value: string): boolean => value.includes('[#') && value.includes(']')

const parseCustomAnchor = (value: string): string =>
  value.slice(value.indexOf('[#') + 2, value.indexOf(']'))

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9- ]/g, '')
    .replace(/[ ]/g, '-')

export const removeAnchor = (text: any) => {
  if (typeof text === 'object' && Array.isArray(text)) {
    return text.filter((x) => !(typeof x === 'string' && hasCustomAnchor(x)))
  } else if (typeof text === 'string') {
    if (text.indexOf('[#') > 0) return text.slice(0, text.indexOf('[#'))
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

export const highlightSelectedNavItem = (id: string) => {
  const navMenuItems = document.querySelectorAll<HTMLAnchorElement>('.function-link-item a')

  // find any currently active items and remove them
  const currentActiveItems = document.querySelectorAll('.function-link-list .text-brand')
  currentActiveItems.forEach((item) => item.classList.remove('text-brand'))

  // Add active class to the current item
  navMenuItems.forEach((item) => {
    if (item.href.split('/').at(-1) === id) {
      item.classList.add('text-brand')
    }
  })
}
