import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { Ring, Bars, lastDays } from '@/components/Viz'
export default async function Admin() {
  const { sb, profile } = await requireRole('admin')
  const c = (t: string, f?: (q: any) => any) => { let q: any = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return q }
  const since = new Date(Date.now() - 8 * 864e5).toISOString()
  const [st, qs, gm, ex, pg, pe, pp, at, an, rec, last] = await Promise.all([c('profiles', q => q.eq('role', 'student')), c('questions'), c('quizzes', q => q.eq('kind', 'game')), c('quizzes', q => q.eq('kind', 'exam')),
    c('quizzes', q => q.eq('kind', 'game').eq('status', 'published')), c('quizzes', q => q.eq('kind', 'exam').eq('status', 'published')), c('paths', q => q.eq('status', 'published')),
    sb.from('attempts').select('score_pct, kind, passed'), sb.from('attempt_answers').select('is_correct, question_id, questions(text, category)'),
    sb.from('attempts').select('created_at').gte('created_at', since), sb.from('attempts').select('user_id, score_pct, created_at, quizzes(title)').order('created_at', { ascending: false }).limit(6)])
  const A = (at.data ?? []) as any[]; const avg = A.length ? Math.round(A.reduce((s, x) => s + x.score_pct, 0) / A.length) : 0
  const exams = A.filter(x => x.kind === 'exam'); const rate = exams.length ? Math.round(100 * exams.filter(x => x.passed).length / exams.length) : 0
  const qa: Record<string, { t: string; w: number; n: number }> = {}, ca: Record<string, { w: number; n: number }> = {}
  for (const a of (an.data ?? []) as any[]) { const q = qa[a.question_id] ??= { t: a.questions?.text ?? '', w: 0, n: 0 }; q.n++; if (!a.is_correct) q.w++
    const k = a.questions?.category ?? '—'; const g = ca[k] ??= { w: 0, n: 0 }; g.n++; if (!a.is_correct) g.w++ }
  const hard = Object.values(qa).filter(x => x.w).sort((a, b) => b.w / b.n - a.w / a.n).slice(0, 4)
  const hardC = Object.entries(ca).filter(([, x]) => x.w).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 3)
  const ids = [...new Set(((last.data ?? []) as any[]).map(x => x.user_id))]
  const { data: pr } = ids.length ? await sb.from('profiles').select('id, full_name').in('id', ids) : { data: [] as any[] }
  const nm = (id: string) => (pr ?? []).find((p: any) => p.id === id)?.full_name || 'Élève'
  const todo: [string, boolean, string][] = [['Inscrire un élève', (st.count ?? 0) > 0, '/admin/eleves'], ['Créer des questions', (qs.count ?? 0) > 0, '/admin/questions'], ['Publier un mini-jeu', (pg.count ?? 0) > 0, '/admin/q/jeux'],
    ['Publier un examen blanc', (pe.count ?? 0) > 0, '/admin/q/examens'], ['Publier un parcours', (pp.count ?? 0) > 0, '/admin/parcours']]
  const nd = todo.filter(t => t[1]).length
  const chips: [string, number, string][] = [['Élèves', st.count ?? 0, '🎓'], ['Questions', qs.count ?? 0, '❓'], ['Mini-jeux', gm.count ?? 0, '🎮']]
  return (<>
    <section className="grid gap-4 lg:grid-cols-[1fr_auto] items-end"><div><p className="muted text-sm">Tableau de bord</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Bienvenue, {profile.full_name || 'administrateur'}</h1></div>
      <div className="grid grid-cols-3 gap-3">{chips.map(([l, v, i]) => <div key={l} className="glass chip"><span className="ico" aria-hidden="true">{i}</span><div><p className="muted text-xs">{l}</p><p className="text-2xl font-semibold">{v}</p></div></div>)}</div></section>
    <section className="grid gap-4 lg:grid-cols-12">
      <div className="glass p-5 lg:col-span-4 grid place-items-center gap-2"><p className="muted text-sm justify-self-start">Moyenne générale</p><Ring value={avg} label="de réussite" size={150} /><p className="muted text-sm">{A.length} partie{A.length > 1 ? 's' : ''} jouée{A.length > 1 ? 's' : ''}</p></div>
      <div className="glass p-5 lg:col-span-4 grid gap-3"><div><p className="muted text-sm">Activité</p><p className="text-4xl font-semibold">{(rec.data ?? []).length}<span className="muted text-base font-normal"> parties / 7 jours</span></p></div><Bars data={lastDays(((rec.data ?? []) as any[]).map(x => x.created_at))} /></div>
      <div className="glass accentcard p-5 lg:col-span-4 lg:row-span-2 grid content-start gap-1"><div className="flex justify-between items-baseline"><h2 className="text-xl font-semibold">Mise en ligne</h2><span className="font-semibold">{nd}/{todo.length}</span></div>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.25)', margin: '6px 0 10px' }}><div style={{ height: 8, borderRadius: 99, background: '#fff', width: `${100 * nd / todo.length}%`, transition: 'width .6s' }} /></div>
        {todo.map(([l, ok, h]) => <Link key={l} href={h} className="todo"><span className={`dot${ok ? ' on' : ''}`}>{ok ? '✓' : ''}</span><span>{l}</span></Link>)}</div>
      <div className="glass p-5 lg:col-span-4 grid place-items-center gap-2"><p className="muted text-sm justify-self-start">Réussite aux examens</p><Ring value={rate} label="examens réussis" size={150} /><p className="muted text-sm">{exams.length} examen{exams.length > 1 ? 's' : ''} réalisé{exams.length > 1 ? 's' : ''}</p></div>
      <div className="glass p-5 lg:col-span-4 grid content-start gap-2"><h2 className="font-semibold">Points difficiles</h2>
        {hard.length ? hard.map(x => <p key={x.t} className="text-sm">{x.t} <span className="muted">· {Math.round(100 * x.w / x.n)} % d’erreurs</span></p>) : <p className="muted text-sm">Pas encore de données.</p>}
        {hardC.length > 0 && <p className="muted text-xs pt-1">Catégories : {hardC.map(([k, x]) => `${k} (${Math.round(100 * x.w / x.n)} %)`).join(' · ')}</p>}</div>
      <div className="glass p-4 lg:col-span-4 self-start"><details className="acc" open><summary>Contenus <span>▾</span></summary><Link href="/admin/questions">Banque de questions</Link><Link href="/admin/q/jeux">Mini-jeux</Link><Link href="/admin/q/examens">Examens blancs</Link><Link href="/admin/parcours">Parcours</Link></details>
        <details className="acc"><summary>Médias <span>▾</span></summary><Link href="/admin/images">Bibliothèque d’images</Link><Link href="/admin/mixage">MIXAGE</Link></details>
        <details className="acc"><summary>Gestion <span>▾</span></summary><Link href="/admin/eleves">Élèves</Link><Link href="/admin/reglages">Paramètres et apparence</Link></details></div>
      <div className="glass p-5 lg:col-span-8"><h2 className="font-semibold mb-2">Activité récente</h2>
        {((last.data ?? []) as any[]).length ? ((last.data ?? []) as any[]).map((a, i) => <div key={i} className="flex justify-between gap-3 text-sm py-2" style={{ borderBottom: '1px solid var(--line)' }}><span>{nm(a.user_id)} <span className="muted">· {a.quizzes?.title ?? 'Contenu supprimé'}</span></span><span className="font-semibold">{a.score_pct} %</span></div>) : <p className="muted text-sm">Aucune activité pour l’instant.</p>}</div>
    </section></>)
}
