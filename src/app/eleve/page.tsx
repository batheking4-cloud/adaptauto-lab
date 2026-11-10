import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { Ring, Bars, lastDays } from '@/components/Viz'
import Logo from '@/components/Logo'
import TopNav from '@/components/TopNav'
const NAV: [string, string][] = [['Accueil', '/eleve'], ['Parcours', '/eleve/parcours'], ['Quiz et examens', '/eleve/quiz'], ['Résultats', '/eleve/resultats'], ['Mes erreurs', '/eleve/erreurs']]
export default async function Eleve() {
  const { sb, user, profile } = await requireRole('student')
  const [{ data: att }, { data: pub }, { data: err }] = await Promise.all([
    sb.from('attempts').select('quiz_id, score_pct, correct, wrong, kind, created_at, quizzes(title)').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('quizzes').select('id, title, kind').eq('status', 'published').order('created_at'), sb.rpc('get_error_questions')])
  const a = (att ?? []) as any[], p = pub ?? [], done = new Set(a.map(x => x.quiz_id))
  const prog = p.length ? Math.round(100 * p.filter(x => done.has(x.id)).length / p.length) : 0
  const next = p.find(x => !done.has(x.id)) ?? p[0], nerr = Array.isArray(err) ? err.length : 0
  const todo = p.filter(x => !done.has(x.id)).slice(0, 5), best = a.length ? Math.max(...a.map(x => x.score_pct)) : 0
  const chips: [string, string | number, string][] = [['Quiz faits', a.filter(x => x.kind === 'game').length, '🎮'], ['Examens', a.filter(x => x.kind === 'exam').length, '📝'], ['Meilleur score', best + ' %', '🏆']]
  return <main className="max-w-6xl mx-auto p-3 sm:p-5 pb-16"><div className="panel grid gap-5">
    <header className="flex items-center justify-between gap-3 flex-wrap"><Logo height={42} /><div className="order-3 w-full lg:order-none lg:w-auto min-w-0"><TopNav items={NAV} /></div>
      <form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form></header>
    <section className="grid gap-4 lg:grid-cols-[1fr_auto] items-end"><div><p className="muted text-sm">Mon espace</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Bonjour {profile.full_name || ''}</h1></div>
      <div className="grid grid-cols-3 gap-3">{chips.map(([l, v, i]) => <div key={l} className="glass chip"><span className="ico" aria-hidden="true">{i}</span><div><p className="muted text-xs">{l}</p><p className="text-2xl font-semibold">{v}</p></div></div>)}</div></section>
    <section className="grid gap-4 lg:grid-cols-12">
      <div className="glass accentcard p-5 lg:col-span-4 grid content-between gap-4" style={{ minHeight: 190 }}>{next ? <><div><p className="muted text-sm">{done.has(next.id) ? 'À rejouer' : 'Pour continuer'}</p><p className="text-2xl font-semibold">{next.title}</p></div>
        <Link href={`/eleve/jouer/${next.id}`} className="btn" style={{ background: '#fff', color: 'var(--accent)', width: 'fit-content' }}>{next.kind === 'exam' ? 'Passer l’examen' : 'Jouer'} →</Link></> : <p className="muted">Aucun contenu publié pour l’instant.</p>}</div>
      <div className="glass p-5 lg:col-span-4 grid gap-3"><div><p className="muted text-sm">Mon activité</p><p className="text-4xl font-semibold">{a.length}<span className="muted text-base font-normal"> parties</span></p></div><Bars data={lastDays(a.map(x => x.created_at))} /></div>
      <div className="glass p-5 lg:col-span-4 lg:row-span-2 grid content-start gap-1"><div className="flex justify-between items-baseline"><h2 className="text-xl font-semibold">À faire</h2><span className="muted">{todo.length} restant{todo.length > 1 ? 's' : ''}</span></div>
        {todo.length ? todo.map(x => <Link key={x.id} href={`/eleve/jouer/${x.id}`} className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid var(--line)', color: 'inherit', textDecoration: 'none' }}><span className="ico" aria-hidden="true">{x.kind === 'exam' ? '📝' : '🎮'}</span><span>{x.title}</span></Link>) : <p className="muted text-sm pt-2">Tout est fait, bravo !</p>}
        <Link href="/eleve/parcours" className="btn btn-ghost" style={{ marginTop: 10, width: 'fit-content' }}>Mes parcours</Link></div>
      <div className="glass p-5 lg:col-span-4 grid place-items-center gap-2"><p className="muted text-sm justify-self-start">Ma progression</p><Ring value={prog} label="des contenus" size={150} /></div>
      <div className="glass p-5 lg:col-span-4 grid content-between gap-3"><div><p className="muted text-sm">Mes erreurs à revoir</p><p className="text-4xl font-semibold">{nerr}</p></div><Link href="/eleve/erreurs" className="btn" style={{ width: 'fit-content' }}>M’entraîner sur mes erreurs</Link></div>
      <div className="glass p-5 lg:col-span-12"><h2 className="font-semibold mb-2">Derniers résultats</h2>
        {a.length ? a.slice(0, 5).map((x, i) => <div key={i} className="flex justify-between gap-3 text-sm py-2" style={{ borderBottom: '1px solid var(--line)' }}><span>{x.quizzes?.title ?? 'Contenu supprimé'} <span className="muted">· {x.correct} bonnes / {x.wrong} mauvaises</span></span><span className="font-semibold">{x.score_pct} %</span></div>) : <p className="muted text-sm">Pas encore de résultat. Lancez un premier quiz !</p>}</div>
    </section></div></main>
}
