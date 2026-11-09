import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadState } from '@/lib/path'
export default async function Liste() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const { data: paths } = await sb.from('paths').select('id').eq('status', 'published').order('created_at')
  const states = (await Promise.all((paths ?? []).map(p => loadState(sb, user.id, p.id)))).filter(Boolean) as any[]
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-4"><Link href="/eleve" className="link">← Mon espace</Link><h1 className="text-3xl font-semibold tracking-tight">Mes parcours</h1>
    {!states.length && <p className="glass p-6 muted">Aucun parcours disponible pour l’instant.</p>}
    {states.map(s => { const n = s.rows.filter((r: any) => r.completed).length, t = s.rows.length
      return <Link key={s.path.id} href={`/eleve/parcours/${s.path.id}`} className="glass p-5 grid gap-2" style={{ textDecoration: 'none', color: 'inherit' }}><p className="font-semibold">{s.path.title}</p><p className="muted text-sm">{s.path.description}</p>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--line)' }}><div style={{ height: 8, borderRadius: 4, background: 'var(--accent)', width: `${t ? 100 * n / t : 0}%` }} /></div><p className="muted text-sm">{n} / {t} étapes terminées</p></Link> })}</main>
}
