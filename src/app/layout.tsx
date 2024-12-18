'use client';

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Contacts API',
  description: 'Contacts API Service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
