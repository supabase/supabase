/**
 * Typography customization for @tailwindcss/typography.
 *
 * Loaded via `@config './typography.config.js'` in tailwind.config.css.
 * Only contains theme.extend.typography — everything else (colors, animations,
 * variants, utilities, base) lives in CSS under packages/config/css/.
 *
 * The typography plugin reads theme.typography to generate .prose, .prose-toc,
 * and .prose-docs classes (and to make them @apply-able). See:
 * https://github.com/tailwindlabs/tailwindcss-typography#customizing-the-css
 */

module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            // Removal of backticks in code blocks.
            // https://github.com/tailwindlabs/tailwindcss-typography/issues/135
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            '--tw-prose-body': 'var(--foreground-light)',
            '--tw-prose-headings': 'var(--foreground-default)',
            '--tw-prose-lead': 'var(--foreground-light)',
            '--tw-prose-links': 'var(--foreground-light)',
            '--tw-prose-bold': 'var(--foreground-light)',
            '--tw-prose-counters': 'var(--foreground-light)',
            '--tw-prose-bullets': 'var(--foreground-muted)',
            '--tw-prose-hr': 'var(--background-surface-300)',
            '--tw-prose-quotes': 'var(--foreground-light)',
            '--tw-prose-quote-borders': 'var(--background-surface-300)',
            '--tw-prose-captions': 'var(--border-strong)',
            '--tw-prose-code': 'var(--foreground-default)',
            '--tw-prose-pre-code': 'var(--foreground-muted)',
            '--tw-prose-pre-bg': 'var(--background-surface-200)',
            '--tw-prose-th-borders': 'var(--background-surface-300)',
            '--tw-prose-td-borders': 'var(--background-default)',
            '--tw-prose-invert-body': 'var(--background-default)',
            '--tw-prose-invert-headings': 'white',
            '--tw-prose-invert-lead': 'var(--background-surface-300)',
            '--tw-prose-invert-links': 'white',
            '--tw-prose-invert-bold': 'white',
            '--tw-prose-invert-counters': 'var(--background-surface-200)',
            '--tw-prose-invert-bullets': 'var(--background-selection)',
            '--tw-prose-invert-hr': 'var(--border-strong)',
            '--tw-prose-invert-quotes': 'var(--background-alternative-default)',
            '--tw-prose-invert-quote-borders': 'var(--border-strong)',
            '--tw-prose-invert-captions': 'var(--background-surface-200)',
            h4: { fontSize: '1.15em' },
            // h5 isn't included in --tw-prose-headings.
            h5: { color: 'var(--color-scale-1200)' },
            'h1, h2, h3, h4, h5, h6': { fontWeight: '400' },
            'article h2, article h3, article h4, article h5, article h6': {
              marginTop: '2em',
              marginBottom: '1em',
            },
            p: { fontWeight: '400' },
            strong: { fontWeight: '500' },
            pre: {
              background: 'none',
              padding: 0,
              marginBottom: '32px',
            },
            ul: {
              listStyleType: 'none',
              paddingLeft: '1rem',
            },
            'ul li': { position: 'relative' },
            'ul li::before': {
              position: 'absolute',
              top: '0.75rem',
              left: '-1rem',
              height: '0.125rem',
              width: '0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--border-strong)',
              content: '""',
            },
            ol: {
              paddingLeft: '1rem',
              counterReset: 'item',
              listStyleType: 'none',
              marginBottom: '3rem',
            },
            'ol>li': {
              display: 'block',
              position: 'relative',
              paddingLeft: '1rem',
            },
            'ol>li::before': {
              position: 'absolute',
              top: '0.25rem',
              left: '-1rem',
              height: '1.2rem',
              width: '1.2rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--background-surface-100)',
              border: '1px solid var(--border-default)',
              content: 'counter(item) "  "',
              counterIncrement: 'item',
              fontSize: '12px',
              color: 'var(--foreground-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            'p img': {
              border: '1px solid var(--border-muted)',
              borderRadius: '4px',
              overflow: 'hidden',
            },
            iframe: {
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            },
            td: {
              borderBottom: '1px solid var(--background-surface-200)',
            },
            code: {
              fontWeight: '400',
              padding: '0.2rem 0.4rem',
              backgroundColor: 'var(--background-surface-200)',
              border: '1px solid var(--background-surface-300)',
              borderRadius: 'var(--radius-lg)',
            },
            a: {
              position: 'relative',
              transition: 'all 0.18s ease',
              paddingBottom: '2px',
              fontWeight: '400',
              opacity: 1,
              color: 'var(--foreground-default)',
              textDecorationLine: 'underline',
              textDecorationColor: 'var(--foreground-muted)',
              textDecorationThickness: '1px',
              textUnderlineOffset: '2px',
            },
            'a:hover': {
              textDecorationColor: 'var(--foreground-default)',
            },
            figcaption: {
              color: 'var(--foreground-muted)',
              fontFamily: 'Office Code Pro, monospace',
            },
            'figure.quote-figure p:first-child': {
              marginTop: '0 !important',
            },
            'figure.quote-figure p:last-child': {
              marginBottom: '0 !important',
            },
            figure: { margin: '3rem 0' },
            'figure img': { margin: '0 !important' },
          },
        },

        toc: {
          css: {
            ul: {
              'list-style-type': 'none',
              'padding-left': 0,
              margin: 0,
              li: { 'padding-left': 0 },
              a: {
                display: 'block',
                marginBottom: '0.4rem',
                'text-decoration': 'none',
                fontSize: '0.8rem',
                fontWeight: '200',
                color: 'var(--foreground-light)',
                '&:hover': {
                  color: 'var(--foreground-default)',
                },
                'font-weight': '400',
              },
              ul: {
                'list-style-type': 'none',
                li: {
                  marginTop: '0.2rem',
                  marginBottom: '0.2rem',
                  'padding-left': '0 !important',
                  'margin-left': '0.5rem',
                },
                a: {
                  fontWeight: '200',
                  color: 'var(--foreground-lighter)',
                  '&:hover': {
                    color: 'var(--foreground-default)',
                  },
                },
              },
            },
          },
        },

        // Used in docs and changelog content.
        docs: {
          css: {
            '--tw-prose-body': 'var(--foreground-light)',
            '--tw-prose-headings': 'var(--foreground-default)',
            '--tw-prose-lead': 'var(--foreground-light)',
            '--tw-prose-links': 'hsl(var(--brand-500))',
            '--tw-prose-bold': 'var(--foreground-light)',
            '--tw-prose-counters': 'var(--foreground-light)',
            '--tw-prose-bullets': 'var(--foreground-muted)',
            '--tw-prose-hr': 'var(--background-surface-300)',
            '--tw-prose-quotes': 'var(--foreground-light)',
            '--tw-prose-quote-borders': 'var(--background-surface-300)',
            '--tw-prose-captions': 'var(--border-strong)',
            '--tw-prose-code': 'var(--foreground-default)',
            '--tw-prose-pre-code': 'var(--foreground-muted)',
            '--tw-prose-pre-bg': 'var(--background-surface-200)',
            '--tw-prose-th-borders': 'var(--background-surface-300)',
            '--tw-prose-td-borders': 'var(--background-default)',
            '--tw-prose-invert-body': 'var(--background-default)',
            '--tw-prose-invert-headings': 'white',
            '--tw-prose-invert-lead': 'var(--background-surface-300)',
            '--tw-prose-invert-links': 'white',
            '--tw-prose-invert-bold': 'white',
            '--tw-prose-invert-counters': 'var(--background-surface-200)',
            '--tw-prose-invert-bullets': 'var(--background-selection)',
            '--tw-prose-invert-hr': 'var(--border-strong)',
            '--tw-prose-invert-quotes': 'var(--background-alternative-default)',
            '--tw-prose-invert-quote-borders': 'var(--border-strong)',
            '--tw-prose-invert-captions': 'var(--background-surface-200)',
            'h1, h2, h3, h4, h5': { fontWeight: '400' },
          },
        },
      },
    },
  },
}
