import { PostgresPolicy } from '@supabase/postgres-meta'
import {
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  IconChevronDown,
} from 'ui'

interface PolicyDetailsProps {
  policy?: PostgresPolicy
  showDetails: boolean
  toggleShowDetails: () => void
}

const PolicyDetails = ({ policy, showDetails, toggleShowDetails }: PolicyDetailsProps) => {
  if (!policy) return null

  return (
    <Collapsible_Shadcn_
      className="-mt-1.5 pb-1.5"
      open={showDetails}
      onOpenChange={toggleShowDetails}
    >
      <CollapsibleTrigger_Shadcn_ className="group pl-[3.6rem] font-normal p-0 [&[data-state=open]>div>svg]:!-rotate-180">
        <div className="flex items-center gap-x-2 w-full">
          <p className="text-xs text-foreground-light group-hover:text-foreground transition">
            View policy details
          </p>
          <IconChevronDown
            className="transition-transform duration-200"
            strokeWidth={1.5}
            size={14}
          />
        </div>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_ className="pl-[3.6rem] grid gap-1.5">
        <div className="flex my-2">
          <div>
            <div className="text-xs flex items-start space-x-2 border-b py-1.5">
              <p className="w-[110px] text-foreground-light">Name:</p>
              <p className="pr-4">{policy.name}</p>
            </div>
            <div className="text-xs flex items-start space-x-2 border-b py-1.5">
              <p className="w-[110px] text-foreground-light">Action:</p>
              <p className="font-mono pr-4">{policy.action}</p>
            </div>
            <div className="text-xs flex items-start space-x-2 border-b py-1.5">
              <p className="w-[110px] text-foreground-light">Command:</p>
              <p className="font-mono pr-4">{policy.command}</p>
            </div>
            <div className="text-xs flex items-start space-x-2 border-b py-1.5">
              <p className="w-[110px] text-foreground-light">Target roles:</p>
              <p className="font-mono pr-4">{policy.roles.join(', ')}</p>
            </div>
            <div className="text-xs flex items-start space-x-2 border-b py-1.5">
              <p className="w-[110px] text-foreground-light">USING expression:</p>
              <p className="font-mono pr-4">{policy.definition}</p>
            </div>
            <div className="text-xs flex items-start space-x-2 pt-1.5">
              <p className="w-[110px] text-foreground-light">CHECK expression:</p>
              <p className={`${policy.check ? '' : 'text-foreground-light'} font-mono pr-4`}>
                {policy.check ?? 'None'}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

export default PolicyDetails
