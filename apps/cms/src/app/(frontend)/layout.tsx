import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Content Management System for the Supabase website',
  title: 'Supabase CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
