import { Inter, Manrope } from 'next/font/google'

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
