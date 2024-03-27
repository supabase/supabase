import React from 'react'
import CodeWindow from '~/components/CodeWindow'

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
  <div className="w-full h-full relative pl-4 lg:-mb-0 pt-4 sm:pt-4 border-b lg:border-none overflow-hidden">
    <CodeWindow
      code={ciCode}
      lang="yaml"
      className="
        rounded-r-none rounded-b-none border-r-0 border-b-0
        h-full !text-[13px] lg:!text-sm leading-4
        [&_.synthax-highlighter]:rounded-b-none
        [&_.synthax-highlighter]:rounded-r-none
        [&_.synthax-highlighter]:border-r-0
        [&_.synthax-highlighter]:border-b-0
        [&_.synthax-highlighter]:!pb-8
        [&_.synthax-highlighter]:lg:min-h-[240px]
        pr-0 pb-0 -bottom-2 lg:-bottom-4
      "
    />
  </div>
)

export default CI
