export type Step = { id: string; chapter: string; type: string; title: string; content: string; video_url: string; quiz_id: string | null; unlock_type: string; min_score: number }
export type Row = { step: Step; completed: boolean; locked: boolean }
// Calcule terminé / verrouillé pour chaque étape (règles définies par l'administrateur)
export function computeRows(steps: Step[], lessons: Set<string>, best: Map<string, number>, ignoreLocks = false): Row[] {
  const done = (s: Step) => s.type === 'lesson' ? lessons.has(s.id) : !!s.quiz_id && best.has(s.quiz_id)
  return steps.map((step, i) => {
    const prev = steps[i - 1]; let locked = false
    if (!ignoreLocks && prev) {
      if (step.unlock_type === 'previous') locked = !done(prev)
      else if (step.unlock_type === 'previous_score') locked = prev.type === 'lesson' ? !done(prev) : (best.get(prev.quiz_id ?? '') ?? -1) < step.min_score
      else if (step.unlock_type === 'all_previous') locked = !steps.slice(0, i).every(done)
    }
    return { step, completed: done(step), locked }
  })
}
export async function loadState(sb: any, userId: string, pathId: string, ignoreLocks = false) {
  const { data: path } = await sb.from('paths').select('id, title, description, status').eq('id', pathId).single()
  if (!path) return null
  const { data: steps } = await sb.from('path_steps').select('*').eq('path_id', pathId).order('position')
  const { data: lp } = await sb.from('lesson_progress').select('step_id').eq('user_id', userId)
  const { data: at } = await sb.from('attempts').select('quiz_id, score_pct').eq('user_id', userId)
  const best = new Map<string, number>(); for (const a of at ?? []) if (a.quiz_id) best.set(a.quiz_id, Math.max(best.get(a.quiz_id) ?? 0, a.score_pct))
  return { path, rows: computeRows(steps ?? [], new Set((lp ?? []).map((x: any) => x.step_id)), best, ignoreLocks) }
}
