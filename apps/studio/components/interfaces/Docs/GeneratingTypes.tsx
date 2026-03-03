import { useParams } from 'common'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { DocSection } from './DocSection'
import CodeSnippet from '@/components/interfaces/Docs/CodeSnippet'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { generateTypes } from '@/data/projects/project-type-generation-query'
import { DOCS_URL } from '@/lib/constants'

interface Props {
  selectedLang: 'bash' | 'js'
}

export function GeneratingTypes({ selectedLang }: Props) {
  const { ref } = useParams()
  const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef: ref })

  const onClickGenerateTypes = async () => {
    try {
      setIsGeneratingTypes(true)
      const res = await generateTypes({ ref, included_schemas: config?.db_schema })
      let element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.types))
      element.setAttribute('download', 'supabase.ts')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      toast.success(`Successfully generated types! File is being downloaded`)
    } catch (error: any) {
      toast.error(`Failed to generate types: ${error.message}`)
    } finally {
      setIsGeneratingTypes(false)
    }
  }

  return (
    <DocSection
      title={
        <span className="flex items-center justify-between">
          <span>Generating types</span>
          <DocsButton href={`${DOCS_URL}/guides/database/api/generating-types`} />
        </span>
      }
      content={
        <>
          <p>
            Supabase APIs are generated from your database, which means that we can use database
            introspection to generate type-safe API definitions.
          </p>
          <p>
            You can generate types from your database either through the{' '}
            <InlineLink href={`${DOCS_URL}/guides/database/api/generating-types`}>
              Supabase CLI
            </InlineLink>
            , or by downloading the types file via the button on the right and importing it in your
            application within <code>src/index.ts</code>.
          </p>
        </>
      }
      snippets={
        <div
          className={
            selectedLang === 'js' ? 'flex flex-col items-center justify-center h-full' : ''
          }
        >
          <div className="flex flex-col items-center justify-center p-10">
            {selectedLang === 'js' && (
              <Button
                type="default"
                disabled={isGeneratingTypes}
                loading={isGeneratingTypes}
                icon={<Download strokeWidth={1.5} />}
                onClick={onClickGenerateTypes}
              >
                Generate and download types
              </Button>
            )}
            <p className="text-xs text-center text-foreground-light mt-4">
              Remember to re-generate and download this file as you make changes to your tables.
            </p>
          </div>
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.cliLogin()} />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={localSnippets.generateTypes(ref ?? '')}
          />
        </div>
      }
    />
  )
}

const localSnippets = {
  cliLogin: () => ({
    title: 'Login via the CLI with your Personal Access Token',
    bash: {
      code: `
npx supabase login
`,
    },
  }),
  generateTypes: (ref: string) => ({
    title: 'Generate types',
    bash: {
      code: `
npx supabase gen types typescript --project-id "${ref}" --schema public > types/supabase.ts
`,
    },
  }),
}
