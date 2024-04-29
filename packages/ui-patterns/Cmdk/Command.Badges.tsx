import { Button, TooltipContent_Shadcn_, TooltipProvider_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui';
import { Microscope } from 'lucide-react';
import { useState } from 'react';

export const BadgeExperimental = () => {
  const [focused, setFocused] = useState(false);
  
  return (
    <TooltipProvider_Shadcn_>
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <Button
            type="outline"
            icon={<Microscope/>}
            onClick={() => setFocused(!focused)}
          >
            Experimental
          </Button>
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_ side="right">
          Supabase AI is experimental and may produce incorrect answers.
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
    </TooltipProvider_Shadcn_>
  );
};
