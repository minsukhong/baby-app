import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '아기 케어 앱',
  description: '신생아 육아를 도와주는 웹 애플리케이션',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
