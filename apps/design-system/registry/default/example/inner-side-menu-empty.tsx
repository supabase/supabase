import { Heart, Pointer } from 'lucide-react'
import React from 'react'
import { Button, Card } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarShimmeringLoaders,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuItem,
  InnerSideMenuSeparator,
} from 'ui-patterns/InnerSideMenu'

export default function InnerSideMenuEmpty() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasItems, setHasItems] = React.useState(false)

  React.useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className="w-64 py-4 flex flex-col gap-4 bg-dash-sidebar">
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Functions" />
        <InnerSideMenuCollapsibleContent className="pt-2">
          <InnerSideBarEmptyPanel
            className="mx-2"
            title="No functions found"
            description="Create your first serverless function to get started."
            illustration={<div className="text-4xl">🚀</div>}
            actions={
              <Button type="default" onClick={() => setHasItems(true)}>
                Create Function
              </Button>
            }
          />
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Functions" />
        <InnerSideMenuCollapsibleContent className="pt-2">
          <InnerSideBarEmptyPanel
            className="mx-2"
            title="No functions found"
            description="Create your first serverless function to get started."
            illustration={
              <figure className="relative mb-3">
                <div className="h-6 w-6 bg-surface-100 border rounded-md flex items-center justify-center">
                  <Heart className="text-light" size={13} />
                </div>
                <Pointer
                  className="absolute -right-[6px] -bottom-2 text-lighter"
                  strokeWidth={1.5}
                  size={16}
                />
              </figure>
            }
            actions={
              <Button type="default" onClick={() => setHasItems(true)}>
                Create Function
              </Button>
            }
          />
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
    </Card>
  )
}
