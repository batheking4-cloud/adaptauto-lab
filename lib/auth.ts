import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// Vérification côté serveur : session valide + rôle lu en base (jamais depuis le navigateur)
export async function requireRole(role: 'admin' | 'student') {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await sb.from('profiles').select('full_name, role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== role) redirect(profile.role === 'admin' ? '/admin' : '/eleve')
  return { sb, user, profile }
}
