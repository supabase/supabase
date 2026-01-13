import type { Appearance } from '@stripe/stripe-js'

export const getStripeElementsAppearanceOptions = (
  resolvedTheme: string | undefined
): Appearance => {
  return {
    labels: 'floating',
    theme: (resolvedTheme?.includes('dark') ? 'night' : 'flat') as 'night' | 'flat',
    variables: {
      fontSizeBase: '14px',
      colorBackground: resolvedTheme?.includes('dark')
        ? 'hsl(0deg 0% 14.1%)'
        : 'hsl(0deg 0% 95.3%)',
      fontFamily:
        'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)',
    },
    rules: {
      '.TermsText': {
        fontSize: '12px',
      },
      '.Label--floating': {
        fontSize: '14px',
      },
      '.Label--resting': {
        fontSize: '14px',
        color: 'rgb(137, 137, 137)',
      },
      '.Input': {
        boxShadow: 'none',
        height: '34px',
        lineHeight: '16px',
        padding: '8px 12px',
      },
      '.AccordionItem': {
        boxShadow: 'none',
      },
    },
  }
}
