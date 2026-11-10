import { literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'

import {
  AI_SRE_ACCESS_LEVELS,
  DEFAULT_AI_SRE_FOCUS_WEIGHTS,
  type AiSreAccessLevel,
  type AiSreCadence,
  type AiSreConfig,
  type AiSreFinding,
  type AiSreFocusWeights,
  type AiSreRun,
  type AiSreRunStatus,
  type AiSreRunTrigger,
  type AiSreTranscriptEvent,
} from './ai-sre.types'

/**
 * Config and run history live in a dedicated `supabase_sre` schema in the
 * project's own Postgres. The DDL is idempotent so it can run on every enable.
 */
export const AI_SRE_SETUP_SQL: SafeSqlFragment = safeSql`
  create schema if not exists supabase_sre;

  create table if not exists supabase_sre.config (
    id boolean primary key default true,
    enabled boolean not null default false,
    cadence text not null default 'daily',
    focus_areas jsonb not null default '{"performance":3,"security":3,"billing":3}',
    github_access_level text not null default 'read_only',
    system_prompt text not null default '',
    updated_at timestamptz not null default now(),
    constraint supabase_sre_config_singleton check (id)
  );

  create table if not exists supabase_sre.runs (
    id uuid primary key default gen_random_uuid(),
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    trigger text not null default 'manual',
    status text not null default 'success',
    summary_md text not null default '',
    findings jsonb not null default '[]',
    confidence numeric,
    github_pr_url text,
    created_at timestamptz not null default now()
  );

  alter table supabase_sre.runs add column if not exists transcript jsonb not null default '[]';
`

const clampWeight = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(5, Math.max(0, Math.round(value)))
}

const sanitizeFocusAreas = (focusAreas: AiSreFocusWeights): AiSreFocusWeights => ({
  performance: clampWeight(focusAreas.performance),
  security: clampWeight(focusAreas.security),
  billing: clampWeight(focusAreas.billing),
})

const sanitizeAccessLevel = (value: string): AiSreAccessLevel =>
  (AI_SRE_ACCESS_LEVELS as readonly string[]).includes(value)
    ? (value as AiSreAccessLevel)
    : 'read_only'

export const buildUpsertConfigSql = (config: AiSreConfig): SafeSqlFragment => {
  const focusAreas = JSON.stringify(sanitizeFocusAreas(config.focusAreas))
  return safeSql`
    insert into supabase_sre.config
      (id, enabled, cadence, focus_areas, github_access_level, system_prompt, updated_at)
    values (
      true,
      ${literal(config.enabled)},
      ${literal(config.cadence)},
      ${literal(focusAreas)}::jsonb,
      ${literal(sanitizeAccessLevel(config.githubAccessLevel))},
      ${literal(config.systemPrompt)},
      now()
    )
    on conflict (id) do update set
      enabled = excluded.enabled,
      cadence = excluded.cadence,
      focus_areas = excluded.focus_areas,
      github_access_level = excluded.github_access_level,
      system_prompt = excluded.system_prompt,
      updated_at = now();
  `
}

export const SELECT_CONFIG_SQL: SafeSqlFragment = safeSql`
  select enabled, cadence, focus_areas, github_access_level, system_prompt, updated_at
  from supabase_sre.config
  where id = true;
`

export const SELECT_RUNS_SQL: SafeSqlFragment = safeSql`
  select id, started_at, finished_at, trigger, status, summary_md, findings, confidence,
    github_pr_url, transcript
  from supabase_sre.runs
  order by started_at desc
  limit 50;
`

export interface InsertRunInput {
  trigger: AiSreRunTrigger
  status: AiSreRunStatus
  summaryMd: string
  findings: AiSreFinding[]
  confidence: number | null
  githubPrUrl: string | null
  finished: boolean
  transcript: AiSreTranscriptEvent[]
}

export const buildInsertRunSql = (run: InsertRunInput): SafeSqlFragment => {
  const findings = JSON.stringify(Array.isArray(run.findings) ? run.findings : [])
  const transcript = JSON.stringify(Array.isArray(run.transcript) ? run.transcript : [])
  const confidence =
    run.confidence === null || !Number.isFinite(run.confidence)
      ? safeSql`null`
      : safeSql`${literal(run.confidence)}`
  const prUrl = run.githubPrUrl ? safeSql`${literal(run.githubPrUrl)}` : safeSql`null`
  const finishedAt = run.finished ? safeSql`now()` : safeSql`null`
  return safeSql`
    insert into supabase_sre.runs
      (finished_at, trigger, status, summary_md, findings, confidence, github_pr_url, transcript)
    values (
      ${finishedAt},
      ${literal(run.trigger)},
      ${literal(run.status)},
      ${literal(run.summaryMd)},
      ${literal(findings)}::jsonb,
      ${confidence},
      ${prUrl},
      ${literal(transcript)}::jsonb
    )
    returning id;
  `
}

// --- Row parsers (DB → typed) ---

type ConfigRow = {
  enabled: boolean
  cadence: string
  focus_areas: AiSreFocusWeights
  github_access_level: string
  system_prompt: string
  updated_at: string
}

export const parseConfigRow = (row: ConfigRow | undefined): AiSreConfig | null => {
  if (!row) return null
  return {
    enabled: Boolean(row.enabled),
    cadence: (row.cadence as AiSreCadence) ?? 'daily',
    focusAreas: { ...DEFAULT_AI_SRE_FOCUS_WEIGHTS, ...(row.focus_areas ?? {}) },
    githubAccessLevel: sanitizeAccessLevel(row.github_access_level),
    systemPrompt: row.system_prompt ?? '',
    updatedAt: row.updated_at,
  }
}

type RunRow = {
  id: string
  started_at: string
  finished_at: string | null
  trigger: string
  status: string
  summary_md: string
  findings: AiSreFinding[] | null
  confidence: number | null
  github_pr_url: string | null
  transcript: AiSreTranscriptEvent[] | null
}

export const parseRunRow = (row: RunRow): AiSreRun => ({
  id: row.id,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  trigger: (row.trigger as AiSreRunTrigger) ?? 'manual',
  status: (row.status as AiSreRunStatus) ?? 'success',
  summaryMd: row.summary_md ?? '',
  findings: Array.isArray(row.findings) ? row.findings : [],
  confidence: row.confidence,
  githubPrUrl: row.github_pr_url,
  transcript: Array.isArray(row.transcript) ? row.transcript : [],
})
