import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { Ring, Bars, lastDays } from '@/components/Viz'
import ActivityPanel from '@/components/ActivityPanel'
export default async function Admin() {
  const { sb, profile } = await requireRole('admin')
  const c = (t: string, f?: (q: any) => any) => { let q: any = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return q }
  const since = new Date(Date.now() - 8 * 864e5).toISOString()
  const [st, qs, gm, ex, ag, ae, at, an, rec] = await Promise.all([c('profiles', q => q.eq('role', 'student')), c('questions'), c('quizzes', q => q.eq('kind', 'game')), c('quizzes', q => q.eq('kind', 'exam')),
    c('attempts', q => q.eq('kind', 'game')), c('attempts', q => q.eq('kind', 'exam')), sb.from('attempts').select('score_pct'), sb.from('attempt_answers').select('is_correct, question_id, questions(text, category)'),
    sb.from('attempts').select('created_at').gte('created_at', since)])
  const avg = at.data?.length ? Math.round(at.data.reduce((s: number, x: any) => s + x.score_pct, 0) / at.data.length) : 0
  const qa: Record<string, { t: string; w: number; n: number }> = {}, ca: Record<string, { w: number; n: number }> = {}
  for (const a of (an.data ?? []) as any[]) { const q = qa[a.question_id] ??= { t: a.questions?.text ?? '', w: 0, n: 0 }; q.n++; if (!a.is_correct) q.w++
    const k = a.questions?.category ?? '—'; const g = ca[k] ??= { w: 0, n: 0 }; g.n++; if (!a.is_correct) g.w++ }
  const hard = Object.values(qa).filter(x => x.w).sort((a, b) => b.w / b.n - a.w / a.n).slice(0, 5)
  const hardC = Object.entries(ca).filter(([, x]) => x.w).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 3)
  const tiles: [string, number][] = [['Élèves', st.count ?? 0], ['Questions', qs.count ?? 0], ['Mini-jeux', gm.count ?? 0], ['Examens', ex.count ?? 0], ['Quiz effectués', ag.count ?? 0], ['Examens réalisés', ae.count ?? 0]]
  const nav: [string, string][] = [['Élèves', '/admin/eleves'], ['Questions', '/admin/questions'], ['Mini-jeux', '/admin/q/jeux'], ['Examens blancs', '/admin/q/examens'], ['Parcours', '/admin/parcours'], ['Images', '/admin/images'], ['MIXAGE', '/admin/mixage'], ['Apparence', '/admin/reglages']]
  return (<>
    <section className="glass p-6 grid gap-4 sm:grid-cols-[auto_1fr] items-center">
      <Ring value={avg} label="moyenne générale" />
      <div className="grid gap-3"><div><p className="muted text-sm">Tableau de bord</p><h1 className="text-3xl font-semibold tracking-tight">Bonjour {profile.full_name || 'administrateur'}</h1></div>
        <div><p className="muted text-sm mb-1">Parties jouées ces 7 derniers jours</p><Bars data={lastDays((rec.data ?? []).map((x: any) => x.created_at))} /></div></div>
    </section>
    <ActivityPanel />
    <nav className="flex gap-2 flex-wrap" aria-label="Gestion">{nav.map(([t, h]) => <Link key={h} href={h} className="btn btn-ghost">{t}</Link>)}</nav>
    <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">{tiles.map(([l, v]) => <div key={l} className="glass p-5"><p className="muted text-sm">{l}</p><p className="text-4xl font-semibold">{v}</p></div>)}</section>
    <section className="grid gap-3 sm:grid-cols-2"><div className="glass p-5"><h2 className="font-semibold mb-2">Questions les plus difficiles</h2>{hard.length ? hard.map(x => <p key={x.t} className="text-sm">{x.t} <span className="muted">· {Math.round(100 * x.w / x.n)} % d’erreurs</span></p>) : <p className="muted text-sm">Pas encore de données.</p>}</div>
      <div className="glass p-5"><h2 className="font-semibold mb-2">Catégories les plus difficiles</h2>{hardC.length ? hardC.map(([k, x]) => <p key={k} className="text-sm">{k} <span className="muted">· {Math.round(100 * x.w / x.n)} % d’erreurs</span></p>) : <p className="muted text-sm">Pas encore de données.</p>}</div></section></>)
}
