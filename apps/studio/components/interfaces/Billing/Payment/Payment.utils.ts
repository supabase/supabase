import type { Appearance } from '@stripe/stripe-js'

export const getStripeElementsAppearanceOptions = (
  resolvedTheme: string | undefined
): Appearance => {
  return {
    theme: (resolvedTheme?.includes('dark') ? 'night' : 'flat') as 'night' | 'flat',
    variables: {
      fontSizeBase: '14px',
      colorBackground: resolvedTheme?.includes('dark')
        ? 'hsl(0deg 0% 14.1%)'
        : 'hsl(0deg 0% 95.3%)',
      fontFamily:
        'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)',
      spacingUnit: '4px',
      borderRadius: '.375rem',
      gridRowSpacing: '4px',
    },
    rules: {
      '.Label': {
        // Hide labels - it is obvious enough what the fields are for
        fontSize: '0',
      },
      '.TermsText': {
        fontSize: '12px',
      },
    },
  }
}
