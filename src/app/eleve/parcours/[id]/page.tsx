import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadState } from '@/lib/path'
const L: Record<string, string> = { previous: 'Terminez l’étape précédente pour débloquer.', previous_score: 'Obtenez le score minimum à l’étape précédente.', all_previous: 'Terminez toutes les étapes précédentes.' }
export default async function Parcours({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ apercu?: string }> }) {
  const { id } = await params; const { apercu } = await searchParams
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const s = await loadState(sb, user.id, id, !!apercu); if (!s) notFound()
  const cur = s.rows.findIndex(r => !r.completed && !r.locked)
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-3"><Link href="/eleve/parcours" className="link">← Mes parcours</Link>
    {apercu && <p className="glass p-3 text-sm">Aperçu élève : les étapes sont toutes accessibles pour que vous puissiez les tester.</p>}
    <h1 className="text-3xl font-semibold tracking-tight">{s.path.title}</h1><p className="muted">{s.path.description}</p>
    {s.rows.map((r, i) => { const st = r.completed ? 'Terminé' : r.locked ? 'Verrouillé' : i === cur ? 'En cours' : 'Disponible'
      const href = r.step.type === 'lesson' ? `/eleve/parcours/${id}/etape/${r.step.id}${apercu ? '?apercu=1' : ''}` : r.step.quiz_id ? `/eleve/jouer/${r.step.quiz_id}${apercu ? '?apercu=1' : ''}` : null
      const body = <><div className="flex justify-between gap-3"><div>{r.step.chapter && (i === 0 || s.rows[i - 1].step.chapter !== r.step.chapter) && <p className="muted text-xs">{r.step.chapter}</p>}
        <p className="font-semibold">{r.step.title}</p><p className="muted text-sm">{r.step.type === 'lesson' ? 'Leçon' : r.step.type === 'exam' ? 'Examen blanc' : 'Mini-jeu / quiz'}</p></div>
        <span className="text-sm" style={{ color: r.completed ? '#30d158' : r.locked ? 'var(--muted)' : 'var(--accent)' }}>{r.locked ? '🔒 ' : r.completed ? '✓ ' : ''}{st}</span></div>
        {r.locked && <p className="muted text-sm">{L[r.step.unlock_type] ?? ''}{r.step.unlock_type === 'previous_score' ? ` (${r.step.min_score} % minimum)` : ''}</p>}</>
      return r.locked || !href ? <div key={r.step.id} className="glass p-5 grid gap-1 opacity-70">{body}</div> : <Link key={r.step.id} href={href} className="glass p-5 grid gap-1" style={{ textDecoration: 'none', color: 'inherit' }}>{body}</Link> })}</main>
}
