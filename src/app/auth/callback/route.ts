import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  if (code) { const sb = await createClient(); await sb.auth.exchangeCodeForSession(code) }
  return NextResponse.redirect(`${origin}${safe}`)
}
