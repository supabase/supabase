import { Source_Code_Pro } from 'next/font/google'
import localFont from 'next/font/local'

export const customFont = localFont({
  variable: '--font-custom',
  display: 'swap',
  fallback: ['Circular', 'custom-font', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  src: [
    {
      path: '../../../design-system/app/fonts/CustomFont-Book.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../design-system/app/fonts/CustomFont-BookItalic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../../design-system/app/fonts/CustomFont-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../design-system/app/fonts/CustomFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../../design-system/app/fonts/CustomFont-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../../../design-system/app/fonts/CustomFont-Black.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../../design-system/app/fonts/CustomFont-BlackItalic.woff2',
      weight: '800',
      style: 'italic',
    },
  ],
})

export const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  fallback: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'monospace'],
  variable: '--font-source-code-pro',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})
