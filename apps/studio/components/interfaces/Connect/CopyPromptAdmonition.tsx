import { Copy } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'

import { BASE_PATH } from 'lib/constants'
import { Badge, Button, copyToClipboard } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

interface CopyPromptAdmonitionProps {
  stepsContainerRef: RefObject<HTMLDivElement | null>
}

export function CopyPromptAdmonition({ stepsContainerRef }: CopyPromptAdmonitionProps) {
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false)

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  const normalizeTextLines = (value: string) => {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
  }

  const getStepTextContent = (contentElement: HTMLElement) => {
    const clone = contentElement.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll('pre, button, svg, input, textarea, select, [aria-hidden="true"]')
      .forEach((element) => element.remove())

    const text = clone.textContent ?? ''
    return normalizeTextLines(text)
  }

  const getStepCodeSnippets = (contentElement: HTMLElement) => {
    const snippets: Array<{ label: string; snippet: string }> = []
    const seen = new Set<string>()

    const addSnippet = (label: string, snippet: string) => {
      if (!snippet || seen.has(snippet)) return
      seen.add(snippet)
      snippets.push({ label, snippet })
    }

    const tabContents = Array.from(
      contentElement.querySelectorAll('[data-connect-tab-content]')
    ) as HTMLElement[]

    tabContents.forEach((tabContent) => {
      const label = tabContent.getAttribute('data-tab-label') || 'Code'
      const tabSnippets = Array.from(tabContent.querySelectorAll('pre'))
        .map((pre) => pre.textContent?.trim())
        .filter((snippet): snippet is string => Boolean(snippet))

      if (tabSnippets.length === 0) {
        const inlineSnippets = Array.from(tabContent.querySelectorAll('code'))
          .filter((code) => !code.closest('pre') && code.closest('.font-mono'))
          .map((code) => code.textContent?.trim())
          .filter((snippet): snippet is string => Boolean(snippet))
        inlineSnippets.forEach((snippet, index) => {
          const inlineLabel = inlineSnippets.length > 1 ? `${label} (part ${index + 1})` : label
          addSnippet(inlineLabel, snippet)
        })
        return
      }

      tabSnippets.forEach((snippet, index) => {
        const tabLabel = tabSnippets.length > 1 ? `${label} (part ${index + 1})` : label
        addSnippet(tabLabel, snippet)
      })
    })

    contentElement.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('[data-connect-tab-content]')) return
      const snippet = pre.textContent?.trim()
      if (snippet) addSnippet('Code', snippet)
    })

    contentElement.querySelectorAll('code').forEach((code) => {
      if (code.closest('pre')) return
      if (code.closest('[data-connect-tab-content]')) return
      if (!code.closest('.font-mono')) return
      const snippet = code.textContent?.trim()
      if (snippet) addSnippet('Code', snippet)
    })

    return snippets
  }

  const handleCopyPrompt = () => {
    const stepElements = stepsContainerRef.current?.querySelectorAll('[data-connect-step]')
    if (!stepElements?.length) return

    const promptContent = Array.from(stepElements)
      .map((stepElement, index) => {
        const title = stepElement.getAttribute('data-step-title') ?? `Step ${index + 1}`
        const description = stepElement.getAttribute('data-step-description') ?? ''
        const contentElement = stepElement.querySelector(
          '[data-step-content]'
        ) as HTMLElement | null

        const details = contentElement ? getStepTextContent(contentElement) : ''
        const codeSnippets = contentElement ? getStepCodeSnippets(contentElement) : []

        const sections = [
          `${index + 1}. ${title}`,
          description,
          details ? `Details:\n${details}` : null,
          codeSnippets.length
            ? `Code:\n${codeSnippets
                .map(({ label, snippet }) => `File: ${label}\n\`\`\`\n${snippet}\n\`\`\``)
                .join('\n\n')}`
            : null,
        ].filter(Boolean)

        return sections.join('\n')
      })
      .join('\n\n')

    copyToClipboard(promptContent)
    setHasCopiedPrompt(true)
    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current)
    }
    copyResetTimerRef.current = setTimeout(() => {
      setHasCopiedPrompt(false)
    }, 2000)
  }

  return (
    <Admonition
      type="tip"
      showIcon={false}
      layout="horizontal"
      className="mb-6"
      actions={
        <Button type="default" size="small" icon={<Copy size={14} />} onClick={handleCopyPrompt}>
          {hasCopiedPrompt ? 'Copied' : 'Copy prompt'}
        </Button>
      }
    >
      {/* Background image */}
      <div className="absolute -inset-16 z-0 opacity-50">
        <img
          src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
          alt="Supabase Grafana"
          className="w-full h-full object-cover object-right hidden dark:block"
        />
        <img
          src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
          alt="Supabase Grafana"
          className="w-full h-full object-cover object-right dark:hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2">
        <div className="flex flex-col gap-y-0.5">
          <div className="flex flex-col gap-y-2 items-start">
            <Badge variant="success" className="-ml-0.5">
              Skip the steps
            </Badge>
            <p className="heading-default">Prompt your agent</p>
          </div>
          <p className="text-sm text-foreground-lighter text-balance">
            Copy a prompt with everything your agent needs to connect your app for you.
          </p>
        </div>
      </div>
    </Admonition>
  )
}
