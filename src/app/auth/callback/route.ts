import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(req: Request) {
  const u = new URL(req.url); const next = u.searchParams.get('next')
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const code = u.searchParams.get('code'), th = u.searchParams.get('token_hash'), type = u.searchParams.get('type')
  const sb = await createClient(); let error: unknown = null
  if (code) error = (await sb.auth.exchangeCodeForSession(code)).error
  else if (th && type) error = (await sb.auth.verifyOtp({ token_hash: th, type: type as any })).error
  return NextResponse.redirect(`${u.origin}${error ? '/lien-invalide' : safe}`)
}
