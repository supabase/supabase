import type { Appearance, CustomFontSource } from '@stripe/stripe-js'

export const STRIPE_ELEMENT_FONTS: CustomFontSource[] = []

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
      fontFamily: 'Inter, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif',
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

export const getAddressElementAppearanceOptions = (
  resolvedTheme: string | undefined
): Appearance => {
  const isDark = resolvedTheme?.includes('dark')

  return {
    labels: 'above' as const,
    theme: (isDark ? 'night' : 'flat') as 'night' | 'flat',
    variables: {
      fontSizeBase: '14px',
      spacingUnit: '7px',
      colorPrimary: isDark ? 'hsl(0deg 0% 32%)' : 'hsl(0deg 0% 55%)',
      colorBackground: isDark ? 'hsl(0deg 0% 14.1%)' : 'hsl(0deg 0% 95.3%)',
      borderRadius: '4px',
      fontFamily: 'Inter, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif',
    },
    rules: {
      '.Input': {
        boxShadow: isDark ? 'none' : 'inset 0 0 0 1px hsl(0deg 0% 80%)',
        height: '34px',
        lineHeight: '16px',
        padding: '8px 12px',
        borderWidth: '1px',
      },
    },
  }
}
