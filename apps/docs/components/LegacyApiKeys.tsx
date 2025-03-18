import {
  TooltipProvider_Shadcn_,
  Tooltip_Shadcn_,
  TooltipTrigger_Shadcn_,
  TooltipContent_Shadcn_,
} from 'ui'

interface LegacyApiKeysProps {
  keyword: string
  type: 'anon' | 'secret'
}

export default function LegacyApiKeys({ keyword, type }: LegacyApiKeysProps) {
  return (
    <>
      <TooltipProvider_Shadcn_>
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_>
            <code>{keyword}</code>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ className="text-sm">
            {type === 'anon' ? (
              <p>
                equivalent to the <code>anon</code> key
              </p>
            ) : (
              <p>
                equivalent to the <code>secret</code> key
              </p>
            )}
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </TooltipProvider_Shadcn_>
    </>
  )
}
