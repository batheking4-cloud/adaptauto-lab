import { cookies } from 'next/headers'
import { requireRole } from '@/lib/auth'
import ExamenEcrit from '@/components/ExamenEcrit'
export default async function Page() {
  const { sb, user } = await requireRole('student')
  const ok = !!(await cookies()).get('ecrit_ok')
  const { data: slides } = await sb.from('written_slides').select('slide_no, series, quiz_id, status, question_count').order('slide_no')
  const ids = (slides ?? []).map(s => s.quiz_id).filter(Boolean) as string[]
  const { data: att } = ids.length ? await sb.from('attempts').select('quiz_id, correct, total, passed').eq('user_id', user.id).in('quiz_id', ids) : { data: [] as any[] }
  const best: Record<string, { correct: number; total: number; passed: boolean | null; n: number }> = {}
  for (const a of (att ?? []) as any[]) { const b = best[a.quiz_id]; if (!b) best[a.quiz_id] = { correct: a.correct, total: a.total, passed: a.passed, n: 1 }; else { b.n++; if (a.correct > b.correct) { b.correct = a.correct; b.total = a.total; b.passed = a.passed } } }
  const { data: others } = await sb.from('quizzes').select('id, title, description, duration_min, pass_score').eq('kind', 'exam').eq('status', 'published').is('slide_no', null).order('created_at')
  return <ExamenEcrit slides={slides ?? []} best={best} accepted={ok} others={others ?? []} />
}
