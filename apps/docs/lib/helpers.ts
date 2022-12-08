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

export async function RefMarkdownCompiler(sections) {
  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  await Promise.all(
    sections.map(async (x, i) => {
      if (!x.id) return null

      const pathName = `docs/ref/js/${x.id}.mdx`

      function checkFileExists(x) {
        if (fs.existsSync(x)) {
          return true
        } else {
          return false
        }
      }

      const markdownExists = checkFileExists(pathName)

      if (!markdownExists) return null

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''
      const { data, content } = matter(fileContents)

      markdownContent.push({
        id: x.id,
        title: x.title,
        meta: data,
        // introPage: introPages.includes(x),
        content: content
          ? await serialize(content ?? '', {
              // MDX's available options, see the MDX docs for more info.
              // https://mdxjs.com/packages/mdx/#compilefile-options
              mdxOptions: {
                remarkPlugins: [[remarkCodeHike, { autoImport: false, codeHikeTheme }]],
                useDynamicImport: true,
              },
              // Indicates whether or not to parse the frontmatter from the mdx source
            })
          : null,
      })
    })
  )
}
