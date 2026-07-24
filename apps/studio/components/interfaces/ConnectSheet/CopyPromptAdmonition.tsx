import { Check, Copy } from 'lucide-react'
import { useEffect, useState, type RefObject } from 'react'
import { copyToClipboard } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface CopyPromptButtonProps {
  stepsContainerRef: RefObject<HTMLDivElement | null>
  /** When set, the Copy prompt button uses this verbatim instead of scraping the steps. */
  customPrompt?: string
}

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
    .forEach((element) => {
      element.remove()
    })

  clone.querySelectorAll('p, div').forEach((el) => {
    el.appendChild(document.createTextNode('\n'))
  })

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

  const getSnippet = (element: Element) => {
    const copyValueElement = element.closest('[data-connect-copy-value]') as HTMLElement | null
    return copyValueElement?.dataset.connectCopyValue?.trim() || element.textContent?.trim()
  }

  const tabContents = Array.from(
    contentElement.querySelectorAll('[data-connect-tab-content]')
  ) as HTMLElement[]

  tabContents.forEach((tabContent) => {
    const label = tabContent.getAttribute('data-tab-label') || 'Code'
    const tabSnippets = Array.from(tabContent.querySelectorAll('pre'))
      .map(getSnippet)
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
    const snippet = getSnippet(pre)
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

export const buildConnectPrompt = (stepsContainer: HTMLElement | null) => {
  const stepElements = stepsContainer?.querySelectorAll('[data-connect-step]')
  if (!stepElements?.length) return ''

  const promptContent = Array.from(stepElements)
    .map((stepElement, index) => {
      const title = stepElement.getAttribute('data-step-title') ?? `Step ${index + 1}`
      const description = stepElement.getAttribute('data-step-description') ?? ''
      const contentElement = stepElement.querySelector('[data-step-content]') as HTMLElement | null

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

  return promptContent
}

export function CopyPromptButton({ stepsContainerRef, customPrompt }: CopyPromptButtonProps) {
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  return (
    <ButtonTooltip
      variant="default"
      icon={showCopied ? <Check strokeWidth={2} className="text-brand" /> : <Copy />}
      onClick={() => {
        const textToCopy = customPrompt ?? buildConnectPrompt(stepsContainerRef.current)
        setShowCopied(true)
        copyToClipboard(textToCopy)
      }}
      tooltip={{
        content: {
          side: 'left',
          text: 'Copy these steps for your coding agent',
        },
      }}
    >
      {showCopied ? 'Copied' : 'Copy prompt'}
    </ButtonTooltip>
  )
}
