import matter from 'gray-matter'
import yaml from 'js-yaml'

export function parseFrontmatter(content) {
  return matter(content, {
    schema: yaml.JSON_SCHEMA,
    engines: {
      javascript: () => {
        throw new Error('JavaScript frontmatter is not supported')
      },
    },
  })
}
