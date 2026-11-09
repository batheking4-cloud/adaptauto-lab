import Link from 'next/link'
import { requireRole } from '@/lib/auth'
export default async function Resultats() {
  const { sb, user } = await requireRole('student')
  const { data } = await sb.from('attempts').select('id, kind, score_pct, correct, wrong, total, passed, created_at, quizzes(title)').eq('user_id', user.id).order('created_at', { ascending: false })
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-3"><Link href="/eleve" className="link">← Mon espace</Link><h1 className="text-3xl font-semibold tracking-tight">Mes résultats</h1>
    {(data ?? []).length === 0 && <p className="glass p-6 muted">Aucun résultat pour l’instant.</p>}
    {(data ?? []).map((a: any) => <div key={a.id} className="glass p-4 flex justify-between gap-3"><div><p className="font-medium">{a.quizzes?.title ?? 'Contenu supprimé'}</p>
      <p className="muted text-sm">{a.kind === 'exam' ? 'Examen' : 'Mini-jeu'} · {new Date(a.created_at).toLocaleString('fr-FR')} · {a.correct} bonnes / {a.wrong} mauvaises</p></div>
      <p className="text-2xl font-semibold" style={a.passed === false ? { color: '#ff6b6b' } : {}}>{a.score_pct} %</p></div>)}</main>
}
