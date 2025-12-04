import { Android } from '../Visuals'
import { SurveyStatCard } from '~/components/SurveyResults/SurveyStatCard'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

const toolRankings = [
  { tool: 'execute_sql', share: 69 },
  { tool: 'apply_migration', share: 12 },
  { tool: 'list_tables', share: 6 },
  { tool: 'list_migrations', share: 1.3 },
]

const platformRankings = [
  { client: 'Cursor', share: 33 },
  { client: 'Claude Code', share: 17 },
  { client: 'AI SDK (Vercel)', share: 11 },
  { client: 'VS Code (vanilla)', share: 4 },
]

export const YearOfAI = () => {
  return (
    <>
      <section className="relative max-w-[60rem] h-[420px] mx-auto border-x border-b">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={3}
          tiles={[
            { cell: 1, type: 'dots' },
            { cell: 5, type: 'stripes' },
            { cell: 9, type: 'dots' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-8 py-0 relative">
          <div className="flex justify-between items-center">
            <h1 className="font-bold tracking-tight text-[5.6rem]">Year of AI</h1>

            <Android className="size-32" />
          </div>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-8 py-12 grid grid-cols-2 gap-8 items-start">
        <h2 className="text-2xl">
          Developers are not just writing code. <br />
          They're talking to their databases.
        </h2>

        <p className="text-base text-foreground-lighter">
          AI changed how developers build. With the Supabase MCP Server, AI assistants can now read
          schemas, run queries, and manage migrations directly.
        </p>
      </div>

      <div className="relative max-w-[60rem] mx-auto border-x border-b">
        <div className="px-8 py-4">
          <h3 className="text-lg text-foreground-light">Top MCP Tools by Usage</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-muted">
          {toolRankings.map((item) => (
            <div key={item.tool} className="border-r border-muted last:border-r-0">
              <SurveyStatCard label={item.tool} percent={item.share} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-8 py-12 grid grid-cols-2 gap-8">
        <h2 className="text-2xl">The tools developers use have changed, dramatically.</h2>

        <p className="text-base text-foreground-lighter">
          Cursor and Claude Code together represent 50% of all MCP users. The old guard is being
          lapped by AI-native tools built for the modern era.
        </p>
      </div>

      <div className="relative max-w-[60rem] mx-auto border-x border-b">
        <div className="px-8 py-4">
          <h3 className="text-lg text-foreground-light">Top Platforms by Users</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-muted">
          {platformRankings.map((item) => (
            <div key={item.client} className="border-r border-muted last:border-r-0">
              <SurveyStatCard label={item.client} percent={item.share} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-[60rem] mx-auto border-x border-b p-8">
        <h2 className="text-2xl">Developers love supabase...</h2>
      </div>
    </>
  )
}
