import type { ReactNode } from 'react'

interface TabPanelProps {
  children: ReactNode
}

/** Shared content container for non-Overview detail tabs — matches the Overview's max width minus the rail column. */
export const TabPanel = ({ children }: TabPanelProps) => (
  <div className="mx-auto w-full max-w-[1080px] px-6 py-8 xl:px-10">{children}</div>
)

interface TabPlaceholderProps {
  title: string
  description: string
}

/**
 * Placeholder body used by Permissions/Health/Versions until the backing data
 * is wired up. The empty-state and the headline carry over so the tabs read
 * as deliberate rather than missing.
 */
export const TabPlaceholder = ({ title, description }: TabPlaceholderProps) => (
  <TabPanel>
    <h3 className="m-0 mb-1.5 text-base font-medium">{title}</h3>
    <p className="m-0 max-w-prose text-sm text-foreground-light">{description}</p>
    <div className="mt-6 rounded-md border bg-surface-75 px-6 py-12 text-center text-sm text-foreground-lighter">
      Nothing to show yet.
    </div>
  </TabPanel>
)
