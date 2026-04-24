import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://pupilnetwork-seven.vercel.app'),
  title: {
    default: 'PupilNetwork — Study Smarter, Together',
    template: '%s | PupilNetwork',
  },
  description:
    'Join live study rooms, ask questions, get AI help — all in one place. The student study collaboration platform built for India.',
  keywords: ['study', 'students', 'collaboration', 'Q&A', 'AI tutor', 'India', 'college'],
  alternates: {
    canonical: '/',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'PupilNetwork — Study Smarter, Together',
    description: 'Join live study rooms, ask questions, get AI help — all in one place.',
    url: 'https://pupilnetwork-seven.vercel.app',
    siteName: 'PupilNetwork',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PupilNetwork — Study Smarter, Together',
    description: 'Join live study rooms, ask questions, get AI help — all in one place.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased text-slate-900`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
