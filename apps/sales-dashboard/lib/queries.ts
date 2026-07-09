import { createClient } from '@/lib/supabase/server'
import type { QuoteStage } from '@/types/database'

const PIPELINE_STAGES: QuoteStage[] = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']

export async function getDashboardStats() {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [quotesRes, activitiesRes] = await Promise.all([
    supabase.from('quotes').select('id, amount, stage, sent_at, decided_at'),
    supabase
      .from('activities')
      .select('id, subject, due_at, type')
      .is('completed_at', null)
      .not('due_at', 'is', null)
      .lte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true }),
  ])

  const quotes = quotesRes.data ?? []
  const followUpsDue = activitiesRes.data ?? []

  const revenue = quotes
    .filter((q) => q.stage === 'accepted' && q.decided_at && q.decided_at >= startOfMonth.toISOString())
    .reduce((sum, q) => sum + Number(q.amount ?? 0), 0)

  const quotesSentThisMonth = quotes.filter(
    (q) => q.sent_at && q.sent_at >= startOfMonth.toISOString()
  ).length

  const decided = quotes.filter((q) => q.stage === 'accepted' || q.stage === 'declined')
  const won = decided.filter((q) => q.stage === 'accepted').length
  const winRate = decided.length > 0 ? Math.round((won / decided.length) * 100) : null

  const pipeline = PIPELINE_STAGES.map((stage) => {
    const stageQuotes = quotes.filter((q) => q.stage === stage)
    return {
      stage,
      count: stageQuotes.length,
      amount: stageQuotes.reduce((sum, q) => sum + Number(q.amount ?? 0), 0),
    }
  })

  return {
    revenue,
    quotesSentThisMonth,
    winRate,
    followUpsDue,
    pipeline,
  }
}

export async function getLeadOptions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('id, name, company')
    .order('created_at', { ascending: false })
    .limit(200)

  return data ?? []
}

export async function getCalendarActivities() {
  const supabase = await createClient()

  const rangeStart = new Date()
  rangeStart.setDate(rangeStart.getDate() - 30)
  const rangeEnd = new Date()
  rangeEnd.setDate(rangeEnd.getDate() + 60)

  const { data } = await supabase
    .from('activities')
    .select('*, leads(name, company)')
    .not('due_at', 'is', null)
    .gte('due_at', rangeStart.toISOString())
    .lte('due_at', rangeEnd.toISOString())
    .order('due_at', { ascending: true })

  return data ?? []
}
