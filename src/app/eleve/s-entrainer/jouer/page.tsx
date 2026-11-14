import { requireRole } from '@/lib/auth'
import Player, { type Quiz } from '@/components/Player'
export default async function Jouer({ searchParams }: { searchParams: Promise<{ source?: string; slide?: string; cat?: string; n?: string }> }) {
  const sp = await searchParams; const { sb } = await requireRole('student')
  const source = ['mix', 'slide', 'bank', 'slides'].includes(String(sp.source)) ? String(sp.source) : 'mix'
  const { data, error } = await sb.rpc('start_practice', { p_source: source, p_slide: sp.slide ? Number(sp.slide) : null, p_category: sp.cat || null, p_count: Number(sp.n) || 20 })
  if (error || !data) return <main className="min-h-screen grid place-items-center p-5"><div className="glass p-8 text-center grid gap-4"><p role="alert">{error?.message ?? 'Impossible de démarrer l’entraînement.'}</p><a href="/eleve/s-entrainer" className="btn">Retour</a></div></main>
  const d = data as { session_id: string; questions: Quiz['questions'] }
  const qs = new URLSearchParams(); for (const [k, v] of Object.entries(sp)) if (v && k !== 't') qs.set(k, String(v)); qs.set('t', String(Date.now()))
  return <Player session={d.session_id} practice back="/eleve/s-entrainer" restart={`/eleve/s-entrainer/jouer?${qs.toString()}`} quiz={{ id: 'practice', kind: 'game', title: 'S’entraîner', intro_text: 'Réponds à chaque question : la correction et l’explication apparaissent tout de suite.', outro_text: '', duration_min: null, pass_score: 0, questions: d.questions }} />
}
