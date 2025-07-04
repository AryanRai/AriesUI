import type { Metadata } from 'next'
import './globals.css'
import { AppWithPreloader } from '@/components/app-with-preloader'

export const metadata: Metadata = {
  title: 'Comms',
  description: 'Advanced Communication Interface',
  generator: 'Next.js',
  icons: {
    icon: '/branding/Comms.ico',
    shortcut: '/branding/Comms.ico',
    apple: '/branding/Comms.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppWithPreloader>
          {children}
        </AppWithPreloader>
      </body>
    </html>
  )
}
