import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { TabPanel, Tabs } from '~/features/ui/Tabs'
import { GENERATED_DIRECTORY } from '~/lib/docs'
import { capitalize } from 'lodash-es'

interface Lint {
  path: string
  content: string
}

export async function DatabaseAdvisorsIndex() {
  let lints: Lint[] = []

  try {
    const raw = await readFile(join(GENERATED_DIRECTORY, 'database-advisors.json'), 'utf-8')
    lints = JSON.parse(raw)
  } catch (error) {
    console.warn(
      '[database-advisors] Failed to read generated advisor docs; rendering without them',
      error
    )
  }

  return (
    <Tabs listClassNames="flex flex-wrap gap-2 [&>button]:m-0!" queryGroup="lint">
      {lints.map((lint) => (
        <TabPanel key={lint.path} id={lint.path} label={capitalize(lint.path.replace(/_/g, ' '))}>
          <section id={lint.path}>
            <MDXRemoteBase source={lint.content} />
          </section>
        </TabPanel>
      ))}
    </Tabs>
  )
}
