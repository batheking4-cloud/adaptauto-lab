import { Ring } from './Viz'
import { createClient } from '@/lib/supabase/server'
export default async function ActivityPanel() {
  const sb = await createClient()
  const [{ data: ex }, { data: last }, { data: dq }, { data: dp }] = await Promise.all([sb.from('attempts').select('passed').eq('kind', 'exam'),
    sb.from('attempts').select('user_id, score_pct, kind, created_at, quizzes(title)').order('created_at', { ascending: false }).limit(6),
    sb.from('quizzes').select('id').eq('status', 'draft'), sb.from('paths').select('id').eq('status', 'draft')])
  const ids = [...new Set((last ?? []).map((x: any) => x.user_id))]
  const { data: pr } = ids.length ? await sb.from('profiles').select('id, full_name').in('id', ids) : { data: [] as any[] }
  const name = (id: string) => (pr ?? []).find((p: any) => p.id === id)?.full_name || 'Élève'
  const rate = ex?.length ? Math.round(100 * ex.filter(x => x.passed).length / ex.length) : 0
  const drafts = (dq?.length ?? 0) + (dp?.length ?? 0)
  return (<section className="grid gap-3 sm:grid-cols-[auto_1fr]">
    <div className="glass p-5 grid place-items-center gap-2"><Ring value={rate} label="réussite examens" size={120} /><p className="muted text-sm">{drafts} brouillon{drafts > 1 ? 's' : ''} à publier</p></div>
    <div className="glass p-5"><h2 className="font-semibold mb-2">Activité récente</h2>
      {(last ?? []).length ? (last ?? []).map((a: any, i: number) => <div key={i} className="flex justify-between gap-3 text-sm py-1" style={{ borderBottom: '1px solid var(--line)' }}>
        <span>{name(a.user_id)} · <span className="muted">{a.quizzes?.title ?? 'Contenu supprimé'}</span></span><span className="font-semibold">{a.score_pct} %</span></div>) : <p className="muted text-sm">Aucune activité pour l’instant.</p>}</div></section>)
}
