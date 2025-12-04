import { motion } from 'framer-motion'
import { Android, Dots, Stripes } from '../Visuals'
import { SurveyStatCard } from '~/components/SurveyResults/SurveyStatCard'
import { Button } from 'ui'
import { useWrapped } from '../WrappedContext'

const GRID_COLS = 5
const STAGGER_DELAY = 0.05

const toolRankings = [
  { rank: 1, tool: 'execute_sql', share: 69, calls: '1,470,000' },
  { rank: 2, tool: 'apply_migration', share: 12, calls: '~256,000' },
  { rank: 3, tool: 'list_tables', share: 6, calls: '~128,000' },
  { rank: 4, tool: 'list_migrations', share: 1.3, calls: '~28,000' },
]

const platformRankings = [
  { rank: 1, client: 'Cursor', users: '63,711', share: 33, remoteAdoption: '68%' },
  { rank: 2, client: 'Claude Code', users: '32,062', share: 17, remoteAdoption: '54%' },
  { rank: 3, client: 'AI SDK (Vercel)', users: '20,677', share: 11, remoteAdoption: '99.7%' },
  { rank: 4, client: 'VS Code (vanilla)', users: '8,202', share: 4, remoteAdoption: '36%' },
]

export const YearOfAI = () => {
  const { setCurrentPage } = useWrapped()

  return (
    <>
      <section className="relative max-w-[60rem] h-[420px] mx-auto border-x border-b">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 h-full [&>*]:border-muted [&>*]:border-r [&>*]:border-b [&>*:nth-child(5n)]:border-r-0 [&>*:nth-child(n+11)]:border-b-0">
          {Array.from({ length: 10 }).map((_, i) => {
            const row = Math.floor(i / GRID_COLS)
            const col = i % GRID_COLS
            const diagonalIndex = row + col
            const hasContent = [1, 5, 9].includes(i)

            return (
              <div key={i} className="relative">
                {hasContent && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.35 + diagonalIndex * STAGGER_DELAY,
                      duration: 0.3,
                      ease: 'easeOut',
                    }}
                  >
                    {i === 1 && <Dots />}
                    {i === 5 && <Stripes />}
                    {i === 9 && <Dots />}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>

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
              <SurveyStatCard label={`${item.tool} (${item.calls} calls)`} percent={item.share} />
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
              <SurveyStatCard
                label={`${item.client} (${item.users} users, ${item.remoteAdoption} remote)`}
                percent={item.share}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-[60rem] mx-auto border-x border-b p-8 grid grid-cols-2 gap-8 items-start">
        <h2 className="text-2xl">Developers love supabase...</h2>

        <Button
          size="large"
          className="w-max justify-self-end"
          onClick={() => setCurrentPage('devs')}
        >
          Continue
        </Button>
      </div>
    </>
  )
}
