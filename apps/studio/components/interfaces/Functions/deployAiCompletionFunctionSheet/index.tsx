import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button, Sheet, SheetContent, SheetTrigger } from 'ui'
import { DeployAiCompletionFunctionSheetContent } from './sheet'

export const DeployAiCompletionFunctionSheet = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button type="default" icon={<Plus />}>
          New AI Completion function
        </Button>
      </SheetTrigger>
      <SheetContent
        size="default"
        showClose={false}
        className="flex flex-col gap-0"
        tabIndex={undefined}
      >
        <DeployAiCompletionFunctionSheetContent onClose={() => setIsSheetOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
