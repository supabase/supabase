import { useState } from 'react'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  copyToClipboard,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from 'ui'

import { ErrorRendererProps } from './DefaultErrorRenderer'

const ResourcesExceededErrorRenderer: React.FC<ErrorRendererProps> = ({ error, isCustomQuery }) => {
  const errorAsJson = JSON.stringify(error, null, 2)
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col gap-2 text-foreground-light">
      <div className="flex flex-col gap-1 text-sm">
        <p>This query requires too much memory to be executed.</p>
        <p>
          {isCustomQuery
            ? 'Avoid selecting entire objects and instead select specific keys using dot notation.'
            : 'Avoid querying across a large datetime range.'}
        </p>
        {!isCustomQuery && <p>Please contact support if this error persists.</p>}
      </div>
      <Accordion_Shadcn_ className="text-sm" type="single">
        <AccordionItem_Shadcn_ value="1">
          <AccordionTrigger_Shadcn_>Full error message</AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_>
            <InputGroup>
              <InputGroupTextarea value={errorAsJson} className="font-mono" rows={5} />
              <InputGroupAddon align="block-end">
                <InputGroupButton
                  size="tiny"
                  type="default"
                  className="ml-auto"
                  onClick={() => {
                    copyToClipboard(errorAsJson)
                    setCopied(true)
                    setTimeout(() => {
                      setCopied(false)
                    }, 3000)
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>
      </Accordion_Shadcn_>
    </div>
  )
}

export default ResourcesExceededErrorRenderer
