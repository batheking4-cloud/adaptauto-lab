import 'server-only'
import { createClient } from '@supabase/supabase-js'
// Client à droits complets : utilisé UNIQUEMENT dans des actions serveur, après requireRole('admin'). La clé ne quitte jamais le serveur.
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('La variable SUPABASE_SERVICE_ROLE_KEY est absente sur Vercel.')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
