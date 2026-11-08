import './globals.css'
import type { Metadata, Viewport } from 'next'
export const metadata: Metadata = { title: "ADAPT'AUTO LAB", description: "Apprentissage du Code de la route (prototype)" }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1c1c1e' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>
}
