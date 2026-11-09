import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { Ring, Bars, lastDays } from '@/components/Viz'
export default async function Eleve() {
  const { sb, user, profile } = await requireRole('student')
  const [{ data: att }, { data: pub }, { data: err }] = await Promise.all([
    sb.from('attempts').select('quiz_id, score_pct, correct, wrong, kind, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('quizzes').select('id, title, kind').eq('status', 'published').order('created_at'), sb.rpc('get_error_questions')])
  const a = att ?? [], done = new Set(a.map(x => x.quiz_id)), p = pub ?? []
  const prog = p.length ? Math.round(100 * p.filter(x => done.has(x.id)).length / p.length) : 0
  const next = p.find(x => !done.has(x.id)) ?? p[0]
  const nerr = Array.isArray(err) ? err.length : 0
  const stats: [string, string | number][] = [['Quiz effectués', a.filter(x => x.kind === 'game').length], ['Examens passés', a.filter(x => x.kind === 'exam').length], ['Meilleur score', (a.length ? Math.max(...a.map(x => x.score_pct)) : 0) + ' %'],
    ['Bonnes réponses', a.reduce((s, x) => s + x.correct, 0)], ['Mauvaises réponses', a.reduce((s, x) => s + x.wrong, 0)], ['Erreurs à revoir', nerr]]
  return <main className="max-w-5xl mx-auto p-5 pb-16 grid gap-5">
    <header className="flex items-center justify-between gap-3"><div><p className="muted text-sm">ADAPT’AUTO LAB</p><h1 className="text-3xl font-semibold tracking-tight">Bonjour {profile.full_name || ''}</h1></div>
      <form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form></header>
    <section className="glass p-6 grid gap-5 sm:grid-cols-[auto_1fr] items-center"><Ring value={prog} label="progression" />
      <div className="grid gap-3">{next ? <><p className="muted text-sm">{done.has(next.id) ? 'Rejouer' : 'Continuer'}</p><p className="text-2xl font-semibold">{next.title}</p>
        <Link href={`/eleve/jouer/${next.id}`} className="btn" style={{ width: 'auto' }}>{next.kind === 'exam' ? 'Passer l’examen' : 'Jouer'}</Link></> : <p className="muted">Aucun contenu publié pour l’instant.</p>}
        <div><p className="muted text-sm mb-1">Mon activité (7 jours)</p><Bars data={lastDays(a.map(x => x.created_at))} /></div></div></section>
    <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">{stats.map(([l, v]) => <div key={l} className="glass p-5"><p className="muted text-sm">{l}</p><p className="text-3xl font-semibold">{v}</p></div>)}</section>
    <nav className="flex gap-2 flex-wrap"><Link href="/eleve/parcours" className="btn" style={{ width: 'auto' }}>Mes parcours</Link><Link href="/eleve/quiz" className="btn" style={{ width: 'auto' }}>Mini-jeux, quiz et examens</Link><Link href="/eleve/erreurs" className="btn btn-ghost">M’entraîner sur mes erreurs</Link><Link href="/eleve/resultats" className="btn btn-ghost">Mes résultats</Link></nav></main>
}
