import { PostgresPolicy } from '@supabase/postgres-meta'
import {
  Accordion,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Accordion_Shadcn_,
  IconChevronDown,
} from 'ui'

interface PolicyDetailsProps {
  policy?: PostgresPolicy
}

// [Joshen] Scaffold midway - to chagne to use collapsible
const PolicyDetails = ({ policy }: PolicyDetailsProps) => {
  if (!policy) return null

  return (
    <Accordion_Shadcn_ type="multiple">
      <AccordionItem_Shadcn_ value={'1'}>
        <AccordionTrigger_Shadcn_
          hideIcon
          className="px-4 text-sm font-normal pt-0 pb-2 [&[data-state=open]>div>svg]:!-rotate-180"
        >
          <div className="flex items-center justify-between w-full">
            <p>View policy details</p>
            <IconChevronDown
              className="h-4 w-4 transition-transform duration-200"
              strokeWidth={1.5}
            />
          </div>
        </AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_ className="px-4">
          <div className="flex items-start space-x-2">
            <p className="w-[80px] text-foreground-light">Name:</p>
            <p className="">{policy.name}</p>
          </div>
          <div className="flex items-start space-x-2">
            <p className="w-[80px] text-foreground-light">Action:</p>
            <p className="">{policy.action}</p>
          </div>
          <div className="flex items-start space-x-2">
            <p className="w-[80px] text-foreground-light">Command:</p>
            <p className="">{policy.command}</p>
          </div>
          <div className="flex items-start space-x-2">
            <p className="w-[80px] text-foreground-light">Using:</p>
            <p className="font-mono">{policy.definition}</p>
          </div>
          <div className="flex items-start space-x-2">
            <p className="w-[80px] text-foreground-light">With Check:</p>
            <p className={`${policy.check ? '' : 'text-foreground-light'} font-mono`}>
              {policy.check ?? 'NULL'}
            </p>
          </div>
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
    </Accordion_Shadcn_>
  )
}

export default PolicyDetails
