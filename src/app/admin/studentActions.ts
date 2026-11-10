'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
const done = (msg: string, ok = true) => { revalidatePath('/admin/eleves'); redirect(`/admin/eleves?${ok ? 'ok' : 'err'}=${encodeURIComponent(msg)}`) }
export async function createStudent(fd: FormData) {
  await requireRole('admin')
  const email = String(fd.get('email') || '').trim(), password = String(fd.get('password') || ''), name = String(fd.get('name') || '').trim(), phone = String(fd.get('phone') || '').trim()
  if (!email || password.length < 8) return done('E-mail et mot de passe (8 caractères minimum) obligatoires.', false)
  let msg = ''
  try { const { error } = await adminClient().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, phone } }); if (error) msg = error.message } catch (e: any) { msg = e.message }
  return msg ? done(msg, false) : done('Compte élève créé.')
}
export async function updateStudent(fd: FormData) {
  const { sb } = await requireRole('admin')
  const id = String(fd.get('id')), name = String(fd.get('name') || '').trim(), pw = String(fd.get('password') || ''), phone = String(fd.get('phone') || '').replace(/[^0-9+]/g, '').slice(0, 16)
  const { data: p } = await sb.from('profiles').select('role').eq('id', id).single()
  if (p?.role !== 'student') return done('Seuls les comptes élèves sont modifiables ici.', false)
  let msg = ''
  try {
    const a = adminClient()
    if (pw) { if (pw.length < 8) return done('Mot de passe : 8 caractères minimum.', false); const { error } = await a.auth.admin.updateUserById(id, { password: pw }); if (error) msg = error.message }
    const { error } = await a.from('profiles').update({ full_name: name, phone: phone || null }).eq('id', id); if (error) msg = error.message
  } catch (e: any) { msg = e.message }
  return msg ? done(msg, false) : done('Compte mis à jour.')
}
export async function deleteStudent(fd: FormData) {
  const { sb } = await requireRole('admin'); const id = String(fd.get('id'))
  const { data: p } = await sb.from('profiles').select('role').eq('id', id).single()
  if (p?.role !== 'student') return done('Seuls les comptes élèves peuvent être supprimés ici.', false)
  let msg = ''
  try { const { error } = await adminClient().auth.admin.deleteUser(id); if (error) msg = error.message } catch (e: any) { msg = e.message }
  return msg ? done(msg, false) : done('Compte supprimé.')
}
