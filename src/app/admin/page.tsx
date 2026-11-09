import Link from 'next/link'
import { requireRole } from '@/lib/auth'
export default async function Admin() {
  const { sb, profile } = await requireRole('admin')
  const c = (t: string, f?: (q: any) => any) => { let q: any = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return q }
  const [st, qs, gm, ex, ag, ae, at, an] = await Promise.all([c('profiles', q => q.eq('role', 'student')), c('questions'), c('quizzes', q => q.eq('kind', 'game')), c('quizzes', q => q.eq('kind', 'exam')),
    c('attempts', q => q.eq('kind', 'game')), c('attempts', q => q.eq('kind', 'exam')), sb.from('attempts').select('score_pct'), sb.from('attempt_answers').select('is_correct, question_id, questions(text, category)')])
  const avg = at.data?.length ? Math.round(at.data.reduce((s: number, x: any) => s + x.score_pct, 0) / at.data.length) : 0
  const qa: Record<string, { t: string; w: number; n: number }> = {}, ca: Record<string, { w: number; n: number }> = {}
  for (const a of (an.data ?? []) as any[]) { const q = qa[a.question_id] ??= { t: a.questions?.text ?? '', w: 0, n: 0 }; q.n++; if (!a.is_correct) q.w++
    const k = a.questions?.category ?? '—'; const g = ca[k] ??= { w: 0, n: 0 }; g.n++; if (!a.is_correct) g.w++ }
  const hard = Object.values(qa).filter(x => x.n >= 1 && x.w).sort((a, b) => b.w / b.n - a.w / a.n).slice(0, 5)
  const hardC = Object.entries(ca).filter(([, x]) => x.w).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 3)
  const stats: [string, string | number][] = [['Élèves inscrits', st.count ?? 0], ['Questions', qs.count ?? 0], ['Mini-jeux créés', gm.count ?? 0], ['Examens créés', ex.count ?? 0], ['Quiz effectués', ag.count ?? 0], ['Examens réalisés', ae.count ?? 0], ['Moyenne générale', avg + ' %']]
  const cards: [string, string, string | null][] = [['Élèves', 'Voir les comptes', '/admin/eleves'], ['Banque de questions', 'Créer et modifier', '/admin/questions'], ['Mini-jeux', 'Construire et publier', '/admin/q/jeux'], ['Examens blancs', 'Construire et publier', '/admin/q/examens'],
    ['Paramètres et apparence', 'Thème et couleur', '/admin/reglages'], ['Parcours, MIXAGE, images', 'Bientôt', null]]
  return (<>
    <h1 className="text-3xl font-semibold tracking-tight">Bonjour {profile.full_name || 'administrateur'}</h1>
    <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">{stats.map(([l, v]) => <div key={l} className="glass p-5"><p className="muted text-sm">{l}</p><p className="text-3xl font-semibold">{v}</p></div>)}</section>
    <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([t, d, h]) => h ? <Link key={t} href={h} className="glass p-5 block" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="font-semibold">{t}</h2><p className="muted text-sm mt-1">{d}</p></Link>
      : <div key={t} className="glass p-5 opacity-60"><h2 className="font-semibold">{t}</h2><p className="muted text-sm mt-1">{d}</p></div>)}</section>
    <section className="grid gap-3 sm:grid-cols-2"><div className="glass p-5"><h2 className="font-semibold mb-2">Questions les plus difficiles</h2>{hard.length ? hard.map(x => <p key={x.t} className="text-sm">{x.t} <span className="muted">· {Math.round(100 * x.w / x.n)} % d’erreurs</span></p>) : <p className="muted text-sm">Pas encore de données.</p>}</div>
      <div className="glass p-5"><h2 className="font-semibold mb-2">Catégories les plus difficiles</h2>{hardC.length ? hardC.map(([k, x]) => <p key={k} className="text-sm">{k} <span className="muted">· {Math.round(100 * x.w / x.n)} % d’erreurs</span></p>) : <p className="muted text-sm">Pas encore de données.</p>}</div></section></>)
}
