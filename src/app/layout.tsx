import './globals.css'
import type { Metadata, Viewport } from 'next'
import { createClient } from '@/lib/supabase/server'
export const metadata: Metadata = { title: "ADAPT'AUTO LAB", description: "Apprentissage du Code de la route (prototype)" }
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let mode = 'dark', color = '#0a84ff'
  try {
    const sb = await createClient()
    const { data } = await sb.from('app_settings').select('mode, primary_color').eq('id', 1).maybeSingle()
    if (data) { mode = data.mode === 'light' ? 'light' : 'dark'; if (/^#[0-9a-fA-F]{6}$/.test(data.primary_color)) color = data.primary_color }
  } catch {}
  return <html lang="fr" data-mode={mode}><body style={{ ['--accent' as string]: color }}>{children}</body></html>
}
