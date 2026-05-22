import { useParams } from 'common'
import { Braces } from 'lucide-react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useEmailTemplateEditor } from './EmailTemplateEditorContext'
import type { AuthTemplate } from './EmailTemplates.types'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

interface TemplateVariablesPopoverProps {
  template: AuthTemplate
}

export const TemplateVariablesPopover = ({ template }: TemplateVariablesPopoverProps) => {
  const { ref: projectRef } = useParams()
  const { insertVariable } = useEmailTemplateEditor()

  if (template.variables.length === 0) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="default" size="tiny" icon={<Braces size={14} strokeWidth={1.5} />}>
          Template variables
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-foreground">Template variables</p>
          <p className="text-sm text-foreground-lighter">
            Data placeholders that can be inserted into the subject or body.{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/local-development/customizing-email-templates#template-variables`}
            >
              Learn more
            </InlineLink>
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {template.variables.map((variable) => (
            <Tooltip key={variable.value}>
              <TooltipTrigger asChild>
                <Button
                  type="outline"
                  size="tiny"
                  className="rounded-full"
                  onClick={() => insertVariable(variable.value)}
                >
                  {variable.value}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {variable.description}

                {variable.name === 'Token' &&
                  template.variables.some((x) => x.name === 'ConfirmationURL') && (
                    <>
                      , which can be used instead of{' '}
                      <code className="text-code-inline">ConfirmationURL</code>
                    </>
                  )}

                {variable.name === 'SiteURL' && (
                  <>
                    {' '}
                    as defined in{' '}
                    <InlineLink href={`/project/${projectRef}/auth/url-configuration`}>
                      URL Configuration
                    </InlineLink>
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
