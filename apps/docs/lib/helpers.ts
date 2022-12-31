// [Joshen] I think this can be done better, as its mostly used to choose what
// menus to render in the SideBar.js (Ref Nav.constants.ts)
export function getPageType(asPath: string) {
  let page
  if (!asPath) return ''

  if (asPath.includes('/guides')) {
    page = 'docs'
  } else if (asPath.includes('/reference/javascript/v1')) {
    page = 'reference/javascript/v1'
  } else if (asPath.includes('/reference/javascript')) {
    page = 'reference/javascript'
  } else if (asPath.includes('/reference/dart/v0')) {
    page = 'reference/dart/v0'
  } else if (asPath.includes('/reference/dart')) {
    page = 'reference/dart'
  } else if (asPath.includes('/reference/api')) {
    page = 'reference/api'
  } else if (asPath.includes('/reference/cli')) {
    page = 'reference/cli'
  } else if (asPath.includes('/reference/auth')) {
    page = 'reference/auth'
  } else if (asPath.includes('/reference/realtime')) {
    page = 'reference/realtime'
  } else if (asPath.includes('/reference/storage')) {
    page = 'reference/storage'
  } else if (asPath.includes('/reference')) {
    page = 'reference'
  } else {
    page = 'docs'
  }

  return page
}

export function flattenSections(sections) {
  var a = []
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].id) {
      // only push a section that has an id
      // these are reserved for sidebar subtitles
      a.push(sections[i])
    }
    if (sections[i].items) {
      // if there are subitems, loop through
      a = a.concat(flattenSections(sections[i].items))
    }
  }
  return a
}
