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
  const nq = a.filter(x => x.kind === 'game').length, ne = a.filter(x => x.kind === 'exam').length, first = (profile.full_name || '').split(' ')[0]
  const cont = <div className="glass accentcard p-5 grid content-between gap-4" style={{ minHeight: 170 }}>{next ? <><div><p className="muted text-sm">{done.has(next.id) ? 'À rejouer' : 'Pour continuer'}</p><p className="text-2xl font-semibold">{next.title}</p></div>
    <Link href={`/eleve/jouer/${next.id}`} className="btn" style={{ background: '#fff', color: 'var(--accent)', width: 'fit-content' }}>{next.kind === 'exam' ? 'Passer l’examen' : 'Jouer'} →</Link></> : <p className="muted">Aucun contenu publié pour l’instant.</p>}</div>
  const activity = <div className="glass p-5 grid gap-3"><div><p className="muted text-sm">Mon activité</p><p className="text-4xl font-semibold">{a.length}<span className="muted text-base font-normal"> parties</span></p></div><Bars data={lastDays(a.map(x => x.created_at))} /></div>
  const ringProg = <div className="glass p-5 grid place-items-center gap-2"><p className="muted text-sm justify-self-start">Ma progression</p><Ring value={prog} label="des contenus" size={150} /></div>
  const errCard = <div className="glass p-5 grid content-between gap-3"><div><p className="muted text-sm">Mes erreurs à revoir</p><p className="text-4xl font-semibold">{nerr}</p></div><Link href="/eleve/erreurs" className="btn" style={{ width: 'fit-content' }}>M’entraîner sur mes erreurs</Link></div>
  const todoCard = <div className="glass p-5 grid content-start gap-1"><div className="flex justify-between items-baseline"><h2 className="text-xl font-semibold">À faire</h2><span className="muted">{todo.length} restant{todo.length > 1 ? 's' : ''}</span></div>
    {todo.length ? todo.map(x => <Link key={x.id} href={`/eleve/jouer/${x.id}`} className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid var(--line)', color: 'inherit', textDecoration: 'none' }}><span className="ico" aria-hidden="true">{x.kind === 'exam' ? '📝' : '🎮'}</span><span>{x.title}</span></Link>) : <p className="muted text-sm pt-2">Tout est fait, bravo !</p>}</div>
  const recent = <div className="glass p-5"><h2 className="font-semibold mb-2">Derniers résultats</h2>{a.length ? a.slice(0, 5).map((x, i) => <div key={i} className="flex justify-between gap-3 text-sm py-2" style={{ borderBottom: '1px solid var(--line)' }}><span>{x.quizzes?.title ?? 'Contenu supprimé'} <span className="muted">· {x.correct} bonnes / {x.wrong} mauvaises</span></span><span className="font-semibold">{x.score_pct} %</span></div>) : <p className="muted text-sm">Pas encore de résultat. Lancez un premier quiz !</p>}</div>
  const chips: [string, string | number, string][] = [['Quiz faits', nq, '🎮'], ['Examens', ne, '📝'], ['Meilleur score', best + ' %', '🏆']]
  return <main className="max-w-6xl mx-auto p-3 sm:p-5 pb-8"><div className="panel grid gap-5">
    <div className="hidden lg:grid gap-5">
      <header className="flex items-center justify-between gap-3"><Logo height={42} /><div className="min-w-0"><TopNav items={NAV} /></div><form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form></header>
      <section className="grid gap-4 grid-cols-[1fr_auto] items-end"><div><p className="muted text-sm">Mon espace</p><h1 className="text-4xl font-semibold tracking-tight">Bonjour {profile.full_name || ''}</h1></div>
        <div className="grid grid-cols-3 gap-3">{chips.map(([l, v, i]) => <div key={l} className="glass chip"><span className="ico" aria-hidden="true">{i}</span><div><p className="muted text-xs">{l}</p><p className="text-2xl font-semibold">{v}</p></div></div>)}</div></section>
      <section className="grid gap-4 grid-cols-12"><div className="col-span-4 grid">{cont}</div><div className="col-span-4 grid">{activity}</div><div className="col-span-4 row-span-2 grid content-start">{todoCard}</div>
        <div className="col-span-4 grid">{ringProg}</div><div className="col-span-4 grid">{errCard}</div><div className="col-span-12 grid">{recent}</div></section></div>
    <div className="lg:hidden grid gap-5">
      <div className="mhead"><Logo height={36} /><span className="avatar" aria-hidden="true">{(first[0] || 'É').toUpperCase()}</span></div>
      <div><p className="muted text-sm">Mon espace</p><h1 className="text-2xl font-semibold tracking-tight">Bonjour {first}</h1></div>
      {cont}
      <div className="mtiles">{([['Quiz faits', nq, '🎮', '/eleve/quiz'], ['Examens', ne, '📝', '/eleve/quiz'], ['Meilleur score', best + ' %', '🏆', '/eleve/resultats'], ['Erreurs', nerr, '🎯', '/eleve/erreurs']] as [string, string | number, string, string][]).map(([l, v, i, h]) =>
        <Link key={l} href={h} className="glass mtile"><span className="ico" aria-hidden="true">{i}</span><b>{v}</b><span className="muted text-sm">{l}</span></Link>)}</div>
      <div className="hscroll"><div className="snapc">{ringProg}</div><div className="snapc">{activity}</div></div>
      <div className="secthead"><h2 className="font-semibold">Accès rapide</h2></div>
      <div className="grid grid-cols-2 gap-3">{[['🧭', 'Mes parcours', '/eleve/parcours'], ['🎮', 'Jouer', '/eleve/quiz'], ['📊', 'Résultats', '/eleve/resultats'], ['🎯', 'Mes erreurs', '/eleve/erreurs']].map(([i, l, h]) => <Link key={h} href={h} className="glass mact"><span aria-hidden="true">{i}</span>{l}</Link>)}</div>
      {todoCard}{recent}</div></div></main>
}
