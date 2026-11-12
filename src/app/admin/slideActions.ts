'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
const back = (to: string, k: 'ok' | 'err', m: string): never => { revalidatePath('/admin/diapositives'); revalidatePath('/eleve/examen-ecrit'); redirect(`${to}${to.includes('?') ? '&' : '?'}${k}=${encodeURIComponent(m)}`) }
export async function saveSlide(fd: FormData) {
  const { sb } = await requireRole('admin'); const n = String(fd.get('slide_no')), quiz = String(fd.get('quiz_id')); const to = `/admin/diapositives/${n}`
  const ids: string[] = JSON.parse(String(fd.get('ids') || '[]')); const answers: Record<string, string[]> = {}, expl: Record<string, string> = {}
  for (const id of ids) { answers[id] = fd.getAll('a_' + id).map(String).filter(l => 'ABCD'.includes(l)); expl[id] = String(fd.get('e_' + id) || '') }
  if (ids.some(id => answers[id].length === 0)) return back(to, 'err', 'Chaque question doit avoir au moins une bonne réponse (lettre cochée).')
  const { error } = await sb.rpc('admin_set_slide_answers', { p_quiz: quiz, p_answers: answers, p_expl: expl })
  return error ? back(to, 'err', error.message) : back(to, 'ok', 'Corrections enregistrées.')
}
export async function applyKey(fd: FormData) {
  const { sb } = await requireRole('admin'); const n = Number(fd.get('slide_no')), series = String(fd.get('series')); const sn = Number(series.replace(/\D/g, '')); const to = `/admin/diapositives/${n}`
  const { data: k } = await sb.from('written_slide_keys').select('answer_key').eq('slide_no', sn).maybeSingle()
  const { data: ws } = await sb.from('written_slides').select('quiz_id').eq('slide_no', n).maybeSingle()
  if (!k || !ws?.quiz_id) return back(to, 'err', 'Série de correction ou fichier de questions introuvable.')
  const { data: qq } = await sb.from('quiz_questions').select('question_id, position').eq('quiz_id', ws.quiz_id).order('position')
  const key = k.answer_key as Record<string, string>; const answers: Record<string, string[]> = {}
  ;(qq ?? []).forEach((r, i) => { answers[r.question_id] = String(key[String(i + 1)] ?? '').split('').filter(Boolean) })
  const { error } = await sb.rpc('admin_set_slide_answers', { p_quiz: ws.quiz_id, p_answers: answers })
  if (error) return back(to, 'err', error.message)
  await sb.from('written_slides').update({ series: `B${sn}` }).eq('slide_no', n)
  return back(to, 'ok', `Corrections de la série B${sn} appliquées à la diapositive ${n}.`)
}
export async function setSlideStatus(fd: FormData) {
  const { sb } = await requireRole('admin'); const n = Number(fd.get('slide_no')), want = String(fd.get('status')); const to = '/admin/diapositives'
  const { data: s } = await sb.from('written_slides').select('quiz_id, question_count, expected_questions').eq('slide_no', n).maybeSingle()
  if (!s?.quiz_id) return back(to, 'err', `Diapositive ${n} : aucun fichier de questions reçu.`)
  if (want === 'available') {
    if (s.question_count !== s.expected_questions) return back(to, 'err', `Diapositive ${n} : ${s.question_count}/${s.expected_questions} questions seulement. Elle reste incomplète tant que les pages manquantes ne sont pas ajoutées.`)
    await sb.from('quizzes').update({ status: 'published' }).eq('id', s.quiz_id); await sb.from('written_slides').update({ status: 'available' }).eq('slide_no', n)
    return back(to, 'ok', `Diapositive ${n} ouverte aux élèves.`)
  }
  await sb.from('quizzes').update({ status: 'draft' }).eq('id', s.quiz_id)
  await sb.from('written_slides').update({ status: s.question_count === s.expected_questions ? 'soon' : 'incomplete' }).eq('slide_no', n)
  return back(to, 'ok', `Diapositive ${n} retirée pour les élèves (visible : « bientôt disponible »).`)
}
