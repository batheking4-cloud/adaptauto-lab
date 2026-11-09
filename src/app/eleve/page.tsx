import Link from 'next/link'
import { requireRole } from '@/lib/auth'
export default async function Eleve() {
  const { sb, user, profile } = await requireRole('student')
  const [{ data: att }, { data: pub }, { data: err }] = await Promise.all([
    sb.from('attempts').select('quiz_id, score_pct, correct, wrong, kind').eq('user_id', user.id),
    sb.from('quizzes').select('id').eq('status', 'published'), sb.rpc('get_error_questions')])
  const a = att ?? []; const done = new Set(a.map(x => x.quiz_id))
  const prog = pub?.length ? Math.round(100 * (pub.filter(p => done.has(p.id)).length) / pub.length) : 0
  const stats: [string, string | number][] = [['Progression générale', prog + ' %'], ['Quiz effectués', a.filter(x => x.kind === 'game').length], ['Examens passés', a.filter(x => x.kind === 'exam').length],
    ['Meilleur score', (a.length ? Math.max(...a.map(x => x.score_pct)) : 0) + ' %'], ['Bonnes réponses', a.reduce((s, x) => s + x.correct, 0)], ['Mauvaises réponses', a.reduce((s, x) => s + x.wrong, 0)]]
  const cards: [string, string, string][] = [['Mini-jeux, quiz et examens', 'Jouer et s’entraîner', '/eleve/quiz'], ['Mes résultats', 'Historique des scores', '/eleve/resultats'], [`Mes erreurs (${Array.isArray(err) ? err.length : 0})`, 'M’entraîner sur mes erreurs', '/eleve/erreurs']]
  return <main className="max-w-5xl mx-auto p-5 pb-16 grid gap-5">
    <header className="flex items-center justify-between gap-3"><div><p className="muted text-sm">ADAPT’AUTO LAB</p><h1 className="text-3xl font-semibold tracking-tight">Bonjour {profile.full_name || ''}</h1></div>
      <form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form></header>
    <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">{stats.map(([l, v]) => <div key={l} className="glass p-5"><p className="muted text-sm">{l}</p><p className="text-3xl font-semibold">{v}</p></div>)}</section>
    <section className="grid gap-3 grid-cols-1 sm:grid-cols-3">{cards.map(([t, d, h]) => <Link key={h} href={h} className="glass p-5 block" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="font-semibold">{t}</h2><p className="muted text-sm mt-1">{d}</p></Link>)}</section></main>
}
