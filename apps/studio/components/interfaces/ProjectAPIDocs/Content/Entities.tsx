import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconDownload, IconExternalLink } from 'ui'

import { generateTypes } from 'data/projects/project-type-generation-query'
import { useStore } from 'hooks'
import ContentSnippet from '../ContentSnippet'
import { DOCS_CONTENT } from '../ProjectAPIDocs.constants'
import { ContentProps } from './Content.types'

const Entities = ({ language }: ContentProps) => {
  const { ui } = useStore()
  const { ref } = useParams()

  const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)

  const onClickGenerateTypes = async () => {
    try {
      setIsGeneratingTypes(true)
      const res = await generateTypes({ ref })
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
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to generate types: ${error.message}`,
      })
    } finally {
      setIsGeneratingTypes(false)
    }
  }

  return (
    <>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.entitiesIntroduction} />
      <div>
        <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.generatingTypes} />
        <div className="flex items-center space-x-2 px-4 mt-3">
          <Button asChild type="default" icon={<IconExternalLink />}>
            <Link
              href="https://supabase.com/docs/guides/database/api/generating-types"
              target="_blank"
              rel="noreferrer"
            >
              Documentation
            </Link>
          </Button>
          <Button
            type="default"
            disabled={isGeneratingTypes}
            loading={isGeneratingTypes}
            icon={<IconDownload strokeWidth={1.5} />}
            onClick={onClickGenerateTypes}
          >
            Generate and download types
          </Button>
        </div>
        <p className="text-xs text-foreground-light px-4 mt-2">
          Remember to re-generate and download this file as you make changes to your tables.
        </p>
      </div>
      <ContentSnippet selectedLanguage={language} snippet={DOCS_CONTENT.graphql} />
    </>
  )
}

export default Entities
