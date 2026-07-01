import { Inter, Manrope, Source_Code_Pro } from 'next/font/google'

export const manrope = Manrope({
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['system-ui', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  subsets: ['latin'],
})

export const inter = Inter({
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  subsets: ['latin'],
})

export const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  display: 'swap',
  fallback: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'monospace'],
  subsets: ['latin'],
})
