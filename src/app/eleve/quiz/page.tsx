import Link from 'next/link'
import { requireRole } from '@/lib/auth'
export default async function Liste() {
  const { sb } = await requireRole('student')
  const { data } = await sb.from('quizzes').select('id, kind, title, description, duration_min, pass_score').eq('status', 'published').is('slide_no', null).order('created_at', { ascending: false })
  const sec = (k: string, t: string) => (<section className="grid gap-3"><h2 className="text-xl font-semibold">{t}</h2>
    {(data ?? []).filter(x => x.kind === k).map(x => <Link key={x.id} href={`/eleve/jouer/${x.id}`} className="glass p-5 block" style={{ textDecoration: 'none', color: 'inherit' }}>
      <p className="font-semibold">{x.title}</p><p className="muted text-sm">{x.description}{k === 'exam' ? ` ${x.duration_min ?? '—'} min · réussite à ${x.pass_score} %` : ''}</p></Link>)}
    {!(data ?? []).some(x => x.kind === k) && <p className="muted">Rien de publié pour l’instant.</p>}</section>)
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-5"><Link href="/eleve" className="link">← Mon espace</Link>{sec('game', 'Mini-jeux et quiz')}<Link href="/eleve/examen-ecrit" className="glass p-5 block" style={{ textDecoration: 'none', color: 'inherit' }}><p className="font-semibold">📝 Examen écrit : 12 diapositives (Sénégal)</p><p className="muted text-sm">Conditions réelles de l’épreuve, 25 questions, 4 erreurs maximum.</p></Link>{sec('exam', 'Examens blancs')}</main>
}
