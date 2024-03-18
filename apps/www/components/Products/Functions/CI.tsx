import React from 'react'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

const ciCode = `jobs:
 deploy:
  runs-on: ubuntu-latest
 
  steps:
   - uses: actions/checkout@v3
   - uses: supabase/setup-cli@v1
   with:
    version: latest
   - run: supabase functions deploy
`

const CI = () => (
  <div className="w-full h-full relative pl-4 mb-4 lg:-mb-0 pt-4 sm:pt-4 border-b lg:border-none overflow-hidden">
    <div
      className="relative pl-2 lg:pl-3 w-full transform h-full bg-alternative-200 border-l border-t flex flex-col"
      style={{ borderTopLeftRadius: '12px' }}
    >
      <div className="w-full py-2 lg:py-3 relative flex items-center gap-1.5 lg:gap-2">
        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-foreground-muted rounded-full" />
        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-foreground-muted rounded-full" />
        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-foreground-muted rounded-full" />
      </div>
      <div className="md:-mb-4 h-full [&_div]:h-full flex-1 bottom-0 [&_.synthax-highlighter]:!p-4 [&_.synthax-highlighter]:!h-full [&_.synthax-highlighter]:md:!p-2 [&_.synthax-highlighter]:lg:!p-4 [&_.synthax-highlighter]:!text-[13px] [&_.synthax-highlighter]:lg:!text-sm [&_.synthax-highlighter]:!leading-4">
        <CodeBlock lang="js" size="small">
          {ciCode}
        </CodeBlock>
      </div>
    </div>
  </div>
)

export default CI
