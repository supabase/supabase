import { useParams } from 'common/hooks'
import CodeSnippet from 'components/to-be-cleaned/Docs/CodeSnippet'
import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconDownload, IconExternalLink } from 'ui'

interface Props {
  selectedLang: string
}

export default function GeneratingTypes({ selectedLang }: Props) {
  const { ref } = useParams()
  const { ui } = useStore()
  const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)

  const generateTypes = async () => {
    setIsGeneratingTypes(true)
    const res = await get(`${API_ADMIN_URL}/projects/${ref}/types/typescript`)

    if (!res.error) {
      let element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.types))
      element.setAttribute('download', 'supabase.ts')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      ui.setNotification({
        category: 'success',
        message: `Successfully generated types! File is being downloaded`,
      })
    } else {
      ui.setNotification({
        category: 'error',
        message: `Failed to generate types: ${res.error.message}`,
        error: res.error,
      })
    }

    setIsGeneratingTypes(false)
  }
  return (
    <>
      <h2 className="doc-heading flex items-center justify-between">
        <span>Generating types</span>
        <Link href="https://supabase.com/docs/guides/database/api/generating-types">
          <a target="_blank" rel="noreferrer">
            <Button type="default" icon={<IconExternalLink />}>
              Documentation
            </Button>
          </a>
        </Link>
      </h2>
      <div className="doc-section">
        <article className="text ">
          <p>
            Supabase APIs are generated from your database, which means that we can use database
            introspection to generate type-safe API definitions.
          </p>
          <p>
            You can generate types from your database either through the{' '}
            <Link href="https://supabase.com/docs/guides/database/api/generating-types">
              Supabase CLI
            </Link>
            , or by downloading the types file via the button on the right and importing it in your
            application within <code>src/index.ts</code>.
          </p>
        </article>
        <article
          className={`code ${selectedLang === 'js' ? 'flex items-center justify-center' : ''}`}
        >
          <div className="grid gap-2">
            <p className="text-center">
              {selectedLang === 'js' && (
                <Button
                  type="default"
                  disabled={isGeneratingTypes}
                  loading={isGeneratingTypes}
                  icon={<IconDownload strokeWidth={1.5} />}
                  onClick={generateTypes}
                >
                  Generate and download types
                </Button>
              )}
            </p>
            <p className="text-xs text-scale-1100 bg-scale-200 p-4 mt-2">
              Remember to re-generate and download this file as you make changes to your tables.
            </p>
          </div>
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.cliLogin()} />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={localSnippets.generateTypes(ref ?? '')}
          />
        </article>
      </div>
    </>
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
