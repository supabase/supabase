import { ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

export const OAuthGrantAccordion = ({ children }: { children: ReactNode }) => (
  <Accordion type="multiple" className="divide-y! divide-border!">
    {children}
  </Accordion>
)

interface OAuthGrantAccordionItemProps {
  value: string
  icon: ReactNode
  title: string
  description: string
  sections: { label: string; values: string[] }[]
}

export const OAuthGrantAccordionItem = ({
  value,
  icon,
  title,
  description,
  sections,
}: OAuthGrantAccordionItemProps) => {
  return (
    <AccordionItem value={value} className="border-b-0">
      <AccordionTrigger className="hover:no-underline gap-x-4 py-3.5">
        <span className="shrink-0 text-foreground-lighter">{icon}</span>
        <div className="min-w-0 flex-1 flex flex-col gap-y-1">
          <p className="truncate text-sm text-foreground">{title}</p>
          <p className="text-xs text-foreground-lighter">{description}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-y-2 pl-8">
          {sections
            .filter((section) => section.values.length > 0)
            .map((section) => (
              <div key={section.label} className="flex flex-col gap-1">
                <p className="font-mono text-xs uppercase text-foreground-light">{section.label}</p>
                <p className="text-xs text-foreground">{section.values.join(', ')}</p>
              </div>
            ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
