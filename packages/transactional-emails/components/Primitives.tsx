import type { CSSProperties, ReactNode } from 'react'

import { CONTAINER_WIDTH, font, theme } from '../theme'

/**
 * A deliberately small subset of react-email's component surface, named to match it, so that
 * adopting `@react-email/components` later is an import-path change rather than a rewrite.
 * Everything renders table-based, inline-styled markup: Outlook's engine has no flexbox, no
 * grid, and no `<style>` support worth relying on, so layout has to be tables and every rule
 * has to be an inline attribute.
 */

interface WithChildren {
  children?: ReactNode
}

export const Html = ({ children, lang = 'en' }: WithChildren & { lang?: string }) => (
  <html lang={lang}>{children}</html>
)

export const Head = ({ children }: WithChildren) => (
  <head>
    <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    {/* Tells clients the design is light-only rather than letting them invert it blind. */}
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    {children}
  </head>
)

/**
 * The line a client shows next to the subject. Hidden in the body itself, then padded so the
 * client does not pull the first visible sentence in behind it.
 */
export const Preview = ({ children }: { children: string }) => (
  <div
    style={{
      display: 'none',
      overflow: 'hidden',
      lineHeight: '1px',
      opacity: 0,
      maxHeight: 0,
      maxWidth: 0,
    }}
  >
    {children}
    {'‌ '.repeat(100)}
  </div>
)

export const Body = ({ children }: WithChildren) => (
  <body
    style={{
      margin: 0,
      padding: 0,
      backgroundColor: theme.canvas,
      fontFamily: font.sans,
      WebkitFontSmoothing: 'antialiased',
    }}
  >
    {children}
  </body>
)

export const Container = ({ children }: WithChildren) => (
  <table
    width="100%"
    cellPadding={0}
    cellSpacing={0}
    role="presentation"
    style={{ backgroundColor: theme.canvas, borderCollapse: 'collapse' }}
  >
    <tbody>
      <tr>
        <td align="center" style={{ padding: '32px 12px' }}>
          <table
            width={CONTAINER_WIDTH}
            cellPadding={0}
            cellSpacing={0}
            role="presentation"
            style={{
              width: '100%',
              maxWidth: `${CONTAINER_WIDTH}px`,
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              borderCollapse: 'separate',
            }}
          >
            <tbody>{children}</tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
)

export const Section = ({ children, style }: WithChildren & { style?: CSSProperties }) => (
  <tr>
    <td style={{ padding: '0 32px', ...style }}>{children}</td>
  </tr>
)

export const Heading = ({ children }: WithChildren) => (
  <h1
    style={{
      margin: '0 0 12px',
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
      color: theme.foreground,
    }}
  >
    {children}
  </h1>
)

export const Text = ({
  children,
  muted = false,
  small = false,
}: WithChildren & { muted?: boolean; small?: boolean }) => (
  <p
    style={{
      margin: '0 0 16px',
      fontSize: small ? '13px' : '15px',
      lineHeight: small ? '20px' : '24px',
      color: muted ? theme.foregroundLight : theme.foreground,
    }}
  >
    {children}
  </p>
)

export const Link = ({ href, children }: WithChildren & { href: string }) => (
  <a href={href} style={{ color: theme.brandInk, textDecoration: 'underline' }}>
    {children}
  </a>
)

export const Hr = () => (
  <hr
    style={{
      margin: '24px 0',
      border: 'none',
      borderTop: `1px solid ${theme.border}`,
    }}
  />
)

/**
 * Rendered as a table cell rather than a styled `<a>` so that the whole plate is clickable in
 * clients that collapse inline-block padding.
 */
export const Button = ({
  href,
  children,
  variant = 'primary',
}: WithChildren & { href: string; variant?: 'primary' | 'secondary' }) => {
  const isPrimary = variant === 'primary'

  return (
    <table cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              backgroundColor: isPrimary ? theme.brandInk : theme.surface,
              border: `1px solid ${isPrimary ? theme.brandInk : theme.borderStrong}`,
              borderRadius: '6px',
            }}
          >
            <a
              href={href}
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '20px',
                color: isPrimary ? '#FFFFFF' : theme.foreground,
                textDecoration: 'none',
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export const Mono = ({ children }: WithChildren) => (
  <span style={{ fontFamily: font.mono, fontSize: '13px' }}>{children}</span>
)
