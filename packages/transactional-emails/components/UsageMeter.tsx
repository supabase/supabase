import type { ReactNode } from 'react'

import { font, theme } from '../theme'

export type MeterTone = 'neutral' | 'warning' | 'destructive'

const TONE_FILL: Record<MeterTone, string> = {
  neutral: theme.foregroundLight,
  warning: theme.warning,
  destructive: theme.destructive,
}

interface UsageMeterProps {
  label: string
  /** Formatted for a person: "412 of 500 vCPU-min". */
  value: string
  /** 0–1. Values above 1 clamp, because a bar wider than its track renders as overflow. */
  ratio: number
  tone?: MeterTone
  caption?: string
}

/**
 * The in-product meter, rebuilt as a two-cell table. A `<div>` with a percentage width is the
 * obvious implementation and the one Outlook ignores; nested table cells are the only bar that
 * renders the same everywhere.
 */
export const UsageMeter = ({ label, value, ratio, tone = 'neutral', caption }: UsageMeterProps) => {
  const filledPercent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100)
  const emptyPercent = 100 - filledPercent

  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td style={{ paddingBottom: '6px', fontSize: '13px', color: theme.foregroundLight }}>
            {label}
          </td>
          <td
            align="right"
            style={{
              paddingBottom: '6px',
              fontSize: '13px',
              fontFamily: font.mono,
              color: theme.foreground,
            }}
          >
            {value}
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <table
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              role="presentation"
              style={{ borderCollapse: 'collapse', backgroundColor: theme.surfaceMuted }}
            >
              <tbody>
                <tr>
                  {filledPercent > 0 && (
                    <td
                      width={`${filledPercent}%`}
                      style={{ height: '4px', backgroundColor: TONE_FILL[tone], fontSize: 0 }}
                    >
                      &nbsp;
                    </td>
                  )}
                  {emptyPercent > 0 && (
                    <td
                      width={`${emptyPercent}%`}
                      style={{ height: '4px', backgroundColor: theme.surfaceMuted, fontSize: 0 }}
                    >
                      &nbsp;
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        {caption && (
          <tr>
            <td
              colSpan={2}
              style={{ paddingTop: '6px', fontSize: '12px', color: theme.foregroundLighter }}
            >
              {caption}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export interface ProjectUsageRow {
  name: string
  usage: string
  /** Share of the organization's consumption, 0–1. Drives the inline bar. */
  share: number
}

/**
 * Ranked projects. This is the part a billing owner forwards: the email tells them the money,
 * the table tells the developer where it went.
 */
export const ProjectUsageTable = ({ rows }: { rows: ProjectUsageRow[] }) => (
  <table
    width="100%"
    cellPadding={0}
    cellSpacing={0}
    role="presentation"
    style={{ borderCollapse: 'collapse', marginBottom: '16px' }}
  >
    <tbody>
      {rows.map((row) => (
        <tr key={row.name}>
          <td
            style={{
              padding: '8px 0',
              borderTop: `1px solid ${theme.border}`,
              fontSize: '13px',
              color: theme.foreground,
            }}
          >
            {row.name}
          </td>
          <td
            align="right"
            style={{
              padding: '8px 0',
              borderTop: `1px solid ${theme.border}`,
              fontSize: '13px',
              fontFamily: font.mono,
              color: theme.foregroundLight,
              whiteSpace: 'nowrap',
            }}
          >
            {row.usage}
            <span style={{ color: theme.foregroundLighter }}>
              {'  '}
              {Math.round(row.share * 100)}%
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const TONE_SURFACE: Record<MeterTone, string> = {
  neutral: theme.surfaceMuted,
  warning: theme.warningSurface,
  destructive: theme.destructiveSurface,
}

interface CalloutProps {
  tone: MeterTone
  children: ReactNode
}

export const Callout = ({ tone, children }: CalloutProps) => {
  const background = TONE_SURFACE[tone]

  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ borderCollapse: 'separate', marginBottom: '16px' }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: '12px 14px',
              backgroundColor: background,
              borderLeft: `2px solid ${TONE_FILL[tone]}`,
              borderRadius: '4px',
              fontSize: '13px',
              lineHeight: '20px',
              color: theme.foreground,
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
